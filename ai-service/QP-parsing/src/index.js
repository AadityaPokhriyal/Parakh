import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';

import parseQuestionPaper from '../controllers/ai.js';
import validateFileType from '../middlewares/validateFile.js'
import uploadFiles from '../middlewares/upload.js';
import authenticate from '../middlewares/authenticate.js';

dotenv.config();
const upload = multer({ storage: multer.memoryStorage() });

const app=express();
const port=process.env.PORT || 3000;

app.post('/ai/parse-question-paper', authenticate, upload.array('QP',15), validateFileType, uploadFiles, parseQuestionPaper);

// uploadFiles uploads pdf to the gemini's cloud storage using the files api and returns an inputArray that contains all the
// the content to be sent to AI to req.inputArray property. Notice that uploading to buffer is already done by multer in first middleware.

app.listen(port, "0.0.0.0", ()=>{
    console.log(`Listening to port ${port}...`);
});