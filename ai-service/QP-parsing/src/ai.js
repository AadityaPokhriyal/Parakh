import { GoogleGenAI } from '@google/genai';
import finalPaperSchema from './schema.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import { json } from 'stream/consumers';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const promptText = await fs.readFile('prompts/third.txt', 'utf-8');

export default async function parseQuestionPaper(req, res, next) {
    //filePart object used for uploading file.
    let tempFilePaths = []; //used for deleting/unlinking the temp file paths to conserve memory.
    let uploadedFiles = []; //used for deleting the uploaded file references.
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No file was uploaded." });
        }

        let inputArray = []; //actual input array that will contain image's file objects with buffer data or references of files
        //uploaded in the gemini cloud file storage. 
        inputArray.push({ text: promptText });

        const isImage = req.files[0].mimetype.startsWith("image");

        // for(let i=0;i<req.files.length;i++){
        //             inputArray.push(
        //                 {
        //                     inlineData: {
        //                     data: req.files[i].buffer.toString("base64"),
        //                     mimeType: req.files[i].mimetype
        //                         }
        //                 });
        //             if(!isImage) break;
        // } //previously pdfs were also being handled using buffered data.

        if (isImage) {
            // Images are lightweight; standard inline buffers remain performant here
            for (let i = 0; i < req.files.length; i++) {
                inputArray.push({
                    inlineData: {
                        data: req.files[i].buffer.toString("base64"),
                        mimeType: req.files[i].mimetype
                    }
                });
            }
        } else {
            // SOLUTION FOR PDF: Standardize processing using the remote Files API
            console.log("PDF detected. Offloading to Files API...");
            const pdfFile = req.files[0];

            // 1. Stream the memory buffer to a unique local temp file path
            const tempPath = path.join(os.tmpdir(), `gemini-${Date.now()}-${pdfFile.originalname}`);
            tempFilePaths.push(tempPath);
            await fs.writeFile(tempPath, pdfFile.buffer);

            // 2. Upload the local path directly to the Google storage tier
            console.log("Uploading PDF to Google servers...");
            const uploadedFileRef = await ai.files.upload({
                file: tempPath,
                mimeType: 'application/pdf'
            });
            uploadedFiles.push(uploadedFileRef);

            // 3. Poll the processing state until it turns 'ACTIVE'
            let fileStatus = await ai.files.get({ name: uploadedFileRef.name });
            while (fileStatus.state === 'PROCESSING') {
                console.log("Google backend is processing heavy PDF pages... waiting 2 seconds.");
                await new Promise(resolve => setTimeout(resolve, 2000));
                fileStatus = await ai.files.get({ name: uploadedFileRef.name });
            }

            if (fileStatus.state === 'FAILED') {
                throw new Error("Google API backend failed to parse the structural PDF file layers.");
            }

            // 4. Reference the pre-processed document directly using the remote file object
            inputArray.push({
                fileData: {
                    fileUri: uploadedFileRef.uri,
                    mimeType: uploadedFileRef.mimeType
                }
            });
        }

        console.log("Generating response...");

        const maxRetries = 5;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const model_name = attempt > 3 ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
            try {
                const response = await ai.models.generateContent({
                    model: model_name,
                    contents: inputArray,
                    config: {
                        // Force the API to output strict JSON matching your layout and cachedContent stores the repeated prompt in each request.
                        responseMimeType: 'application/json',
                        responseSchema: finalPaperSchema, //schema
                        temperature: 0.1
                    },
                });
                // The text returned is guaranteed to be a 100% syntactically valid JSON string
                const rawJsonText = response.text;
                const parsedData = JSON.parse(rawJsonText);
                console.log("Successfully sent the response!");
                return res.json(parsedData);
                // try{

                // }
                // catch(err){
                //     let correctionPrompt=rawJsonText+" return a valid JSON format by fixing the given json without any additional information.";
                //     const corrected_response = await ai.models.generateContent({
                //     model: 'gemini-3.5-flash',
                //     contents: correctionPrompt,
                //     config:{
                //         responseMimeType:"application/json"
                //     }
                //     });
                //     try{
                //         const jsonText=corrected_response.text;
                //         const parsedJSON=JSON.parse(jsonText);
                //         console.log("Successfully sent the response!");
                //         return res.json(parsedJSON);
                //     }
                //     catch(err){
                //         console.log("The AI cannot even correct an incorrect json.");
                //         throw err;
                //     }
                // }       
            }
            catch (err) {
                const status = err.status ?? err.code ?? 500;
                if ((status === 503 || status === 429) && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`${status} received. Retry ${attempt}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw err;
            }
        }

    }
    catch (err) {
        console.error(err);
        const errStatus = err.status ?? err.code ?? 500;
        return res.status(errStatus).json({
            success: false,
            message: err.message
        });
    }
    finally {
        // --- HOUSEKEEPING & SYSTEM SANITIZATION ---
        // A. Erase local server instances from storage disk
        for (const localPath of tempFilePaths) {
            await fs.unlink(localPath).catch(e => console.error("Disk purge mismatch:", e));
        }
        // B. Purge remote file cloud references from the cloud runtime tier immediately
        for (const cloudFile of uploadedFiles) {
            await ai.files.delete({ name: cloudFile.name }).catch(e => console.error("Cloud purge mismatch:", e));
        }
    }
}
