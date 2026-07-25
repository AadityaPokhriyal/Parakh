from fastapi import FastAPI, UploadFile, HTTPException, File
from google import genai
from google.genai import types

from helpers.prompt import evaluation_prompt
from helpers.validate import get_clean_mime_type, sort_files_by_index, validate_file_batch
from helpers.validate_json import is_valid_json

from pydantic_models.evaluation_response_model import EvaluationOutput
from pydantic_models.questions_schema_model import QuestionPaper

import os
import logging
from typing import List
from dotenv import load_dotenv

# logs setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# env setup
load_dotenv()

# fastapi setup
app = FastAPI()

# gemini sdk setup
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
logger.info("client loaded")


@app.get('/')
def status():
    return {"message": "api is running"}


@app.post('/ai/evaluate-answers')
async def evaluate(
    answers: List[UploadFile] = File(..., alias="answers"),
    question_json: UploadFile = File(..., alias="question_json")
):
    # 1. JSON Format and Schema Check
    if question_json.content_type != "application/json":
        raise HTTPException(
            status_code=400,
            detail="Question paper must be submitted as a JSON file"
        )
    
    if not await is_valid_json(question_json, QuestionPaper):
        raise HTTPException(
            status_code=422,
            detail="Unexpected question JSON schema, please refer to docs."
        )
    logger.info("Question JSON format and schema validated")

    # 2. Sort answer files by index prefix
    sorted_answer_files = sort_files_by_index(answers)

    # 3. Validate batch content (single PDF or all images)
    try:
        batch_type = validate_file_batch(sorted_answer_files)
        logger.info(f"Answer files validated successfully. Detected type: {batch_type}")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    uploaded_gemini_files = []
    
    try:
        # 4. Upload Question Paper JSON to Gemini Files API
        question_json.file.seek(0)
        uploaded_question_json = client.files.upload(
            file=question_json.file,
            config=dict(mime_type='application/json')
        )
        uploaded_gemini_files.append(uploaded_question_json)
        logger.info("Question JSON uploaded to Gemini Files API")

        answer_parts = []

        if batch_type == "pdf":
            # PDF Flow: Upload via Files API
            pdf_file = sorted_answer_files[0]
            pdf_file.file.seek(0)
            uploaded_pdf = client.files.upload(
                file=pdf_file.file,
                config=dict(mime_type="application/pdf")
            )
            uploaded_gemini_files.append(uploaded_pdf)
            
            answer_parts.append({
                "type": "document",
                "uri": uploaded_pdf.uri,
                "mime_type": "application/pdf"
            })
            logger.info(f"Uploaded PDF {pdf_file.filename} via Files API")

        else:
            # Images Flow: Upload each image via Files API
            for file_obj in sorted_answer_files:
                mime_type = get_clean_mime_type(file_obj) or "image/png"
                file_obj.file.seek(0)
                
                uploaded_img = client.files.upload(
                    file=file_obj.file,
                    config=dict(mime_type=mime_type)
                )
                uploaded_gemini_files.append(uploaded_img)

                answer_parts.append({
                    "type": "image",
                    "uri": uploaded_img.uri,
                    "mime_type": mime_type
                })
                logger.info(f"Uploaded image {file_obj.filename} via Files API")

        # 5. Build interaction input payload
        input_payload = [
            {
                "type": "document",
                "uri": uploaded_question_json.uri,
                "mime_type": "application/json"
            },
            *answer_parts,
            {"type": "text", "text": evaluation_prompt}
        ]

        # 6. Model Request
        interaction = client.interactions.create(
            model="gemini-3-flash-preview",
            store=False,
            input=input_payload,
            generation_config={
                "temperature": 0,
                "thinking_level": "high"
            },
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": EvaluationOutput.model_json_schema()
            }
        )
        logger.info("Gemini interaction created successfully")
    finally:
        # 7. Clean up Files API uploads (Question JSON and PDF if applicable)
        for g_file in uploaded_gemini_files:
            try:
                client.files.delete(name=g_file.name)
            except Exception as err:
                logger.warning(f"Failed to delete Gemini file {g_file.name}: {err}")
        logger.info("Uploaded temporary files cleaned up")

    eval_json = EvaluationOutput.model_validate_json(interaction.output_text)
    logger.info("Evaluation output parsed and ready")

    return eval_json