import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const promptText = await fs.readFile('prompts/seventh.txt', 'utf-8');

export default async function uploadFiles(req, res, next) {
    
    let tempFilePaths = []; 
    let uploadedFiles = []; 
    let inputArray = []; 

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No file was uploaded." });
        }

        inputArray.push({ text: promptText });
        const isImage = req.files[0].mimetype.startsWith("image");

        if (isImage) {
            for (let i = 0; i < req.files.length; i++) {
                inputArray.push({
                    inlineData: {
                        data: req.files[i].buffer.toString("base64"),
                        mimeType: req.files[i].mimetype
                    }
                });
            }
        } else {
            console.log("PDF detected. Offloading to Files API...");
            const pdfFile = req.files[0];

            const tempPath = path.join(os.tmpdir(), `gemini-${Date.now()}-${pdfFile.originalname}`);
            tempFilePaths.push(tempPath);
            await fs.writeFile(tempPath, pdfFile.buffer);

            console.log("Uploading PDF to Google servers...");
            const uploadedFileRef = await ai.files.upload({
                file: tempPath,
                mimeType: 'application/pdf'
            });
            uploadedFiles.push(uploadedFileRef);

            let fileStatus = await ai.files.get({ name: uploadedFileRef.name });
            while (fileStatus.state === 'PROCESSING') {
                console.log("Google backend is processing heavy PDF pages... waiting 2 seconds.");
                await new Promise(resolve => setTimeout(resolve, 2000));
                fileStatus = await ai.files.get({ name: uploadedFileRef.name });
            }

            if (fileStatus.state === 'FAILED') {
                throw new Error("Google API backend failed to parse the structural PDF file layers.");
            }

            inputArray.push({
                fileData: {
                    fileUri: uploadedFileRef.uri,
                    mimeType: uploadedFileRef.mimeType
                }
            });
        }

        // Pass everything to the next middleware via req
        req.inputArray = inputArray; 
        req.tempFilePaths = tempFilePaths;
        req.uploadedFiles = uploadedFiles;
        
        next();
    } catch (err) {
        console.error(err);
        let errStatus = err.status ?? err.code ?? 500; 
        
        if (err.name === "AbortError" || errStatus === 20 || err.message?.toLowerCase().includes("abort")) {
            errStatus = 408;
        }
        if (typeof errStatus !== 'number' || errStatus < 100 || errStatus > 999) {
            errStatus = 500; 
        }

        // Emergency cleanup because we aren't proceeding to ai.js
        for (const localPath of tempFilePaths) {
            await fs.unlink(localPath).catch(e => console.error("Disk purge mismatch:", e));
        }
        for (const cloudFile of uploadedFiles) {
            await ai.files.delete({ name: cloudFile.name }).catch(e => console.error("Cloud purge mismatch:", e));
        }

        return res.status(errStatus).json({
            success: false,
            message: err.message
        });
    }
}