import { GoogleGenAI } from '@google/genai';
// import finalPaperSchema from '../schemas/schema.js'; //this should be used if regression test fails.
import finalPaperSchema from '../schemas/newSchema.js'; //this is new schema.
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


export default async function parseQuestionPaper(req, res, next) {
    try {

        const inputArray=req.inputArray;

        //  ### Response generation ###

        console.log("Generating response...");

        const primaryModel="gemini-2.5-flash"; // Not using 3.5-flash right now because of busy servers and less priority to free tier.
        const fallbackModel="gemini-2.5-flash";
        let forceFallback=false;
        const maxRetries = 5;
        const responseTimeLimit=90000; //in milliseconds
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const model_name = (attempt > 3 || forceFallback) ? fallbackModel : primaryModel;
            try {
                const responseStream = await ai.models.generateContentStream({
                    model: model_name,
                    contents: inputArray,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: finalPaperSchema, 
                        temperature: 0.1,
                        thinking_level: "low",
                    }
                });

                // 2. Real-time Assembly Line
                let completeText = "";
                
                // The stream object is an async iterable. Loop over chunks as they arrive.
                for await (const chunk of responseStream) {
                    if (chunk.text) {
                        completeText += chunk.text;
                        console.log(`Received chunk of size: ${chunk.text.length}`);
                    }
                }
                // 1. Guard against empty or obviously non-JSON responses
                if (!completeText || !completeText.trim().startsWith('{')) {
                    const structuralErr = new Error(`API returned non-JSON payload: ${completeText?.substring(0, 100)}`);
                    structuralErr.status = 500; // Tag it so the outer catch can see it
                    throw structuralErr;
                }

                try {
                    const parsedData = JSON.parse(completeText);
                    console.log("Successfully sent the response!");
                    return res.json(parsedData);
                } catch (parseError) {
                    console.error(`[Attempt ${attempt}] Malformed JSON payload:`, completeText);
                    
                    // Assign a status property so the outer catch handles it like a transient error
                    parseError.status = 422; // Unprocessable Entity
                    throw parseError; 
                }  
            }
            catch (err) {
                // const isTimeout = err.name === "TimeoutError" ||
                //                   err.name === "AbortError" ||
                //                   err.code === "ETIMEDOUT" ||
                //                   err.code === 20 || // Handles DOMException internal abort code
                //                   err.message?.toLowerCase().includes("timeout") ||
                //                   err.message?.toLowerCase().includes("aborted") ||
                //                   err.message?.includes("DEADLINE_EXCEEDED") ||
                //                   err.message?.includes("DEADLINE");
                // if(!forceFallback && model_name===primaryModel && isTimeout){
                //     console.warn(`[Timeout] Primary model took over ${responseTimeLimit/60000} mins. Switching to ${fallbackModel}...`);
                //     forceFallback=true; // This sets the flag to true and fallbackModel will be used.

                //     // Linear small backoff for timeouts so it doesn't slam the next model
                //     await new Promise(resolve => setTimeout(resolve, 1000));

                //     continue;
                // }
                const status = err.status ?? err.code ?? 500;
                if ((status === 503 || status === 429 || status === 422) && attempt < maxRetries) {
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
        // If the error was a timeout/abort, explicitly set code to standard HTTP 408
        if (err.name === "AbortError" || errStatus === 20 || err.message?.toLowerCase().includes("abort")) {
            errStatus = 408;
        }
        // Guarantee Express will accept the code (must be between 100 and 999)
        if (typeof errStatus !== 'number' || errStatus < 100 || errStatus > 999) {
            errStatus = 500; 
        }
        return res.status(errStatus).json({
            success: false,
            message: err.message
        });
    }
    finally {
        // --- HOUSEKEEPING & SYSTEM SANITIZATION / Cleanup of stored files in tempDir and cloud file storage ---
        const tempFilePaths = req.tempFilePaths || [];
        const uploadedFiles = req.uploadedFiles || [];

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
