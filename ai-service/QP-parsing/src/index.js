import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';

import parseQuestionPaper from './ai.js';
import validateFileType from './validFile.js'

dotenv.config();
const upload = multer({ storage: multer.memoryStorage() });

const app=express();
const port=process.env.PORT || 3000;

app.post('/ai/parse-question-paper',upload.array('QP',15),validateFileType,parseQuestionPaper);

app.listen(port,()=>{
    console.log(`Listening to port ${port}...`);
});