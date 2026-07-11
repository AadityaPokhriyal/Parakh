from fastapi import FastAPI, UploadFile, HTTPException
from google import genai

from helpers.prompt import evaluation_prompt
from helpers.validate_pdf import is_valid_pdf
from helpers.validate_json import is_valid_json

from pydantic_models.evaluation_response_model import EvaluationOutput
from pydantic_models.questions_schema_model import QuestionPaper

import os
import logging
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
client = genai.Client(api_key = os.getenv("GEMINI_API_KEY"));
logger.info("client loaded")




# ENDPOINTS
@app.get('/')
def status():
    return {"messege": "api is running"}

# TODO:add more file validations and annotations (for better api docs)
# TODO: implement concurrency feature
@app.post('/ai/evaluate-answers')
async def evaluate(answer_pdf: UploadFile, question_json: UploadFile):

    # pdf format check
    if answer_pdf.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Answer sheet must be a pdf"
        )
    logger.info("answer pdf format okay")
    
    # json format check
    if question_json.content_type != "application/json":
        raise HTTPException(
            status_code= 400,
            detail="Question paper must be submitted as json file"
        )
    logger.info("question json format okay")
    
    # validate pdf
    if not is_valid_pdf(answer_pdf.file):
        raise HTTPException(
            status_code = 422,
            detail = "invalid pdf"
        )
    logger.info("answer pdf validation Okay")
    
    # validate json structure
    if not await is_valid_json(question_json, QuestionPaper):
        raise HTTPException(
            status_code = 422,
            detail = "unexpected json schema, read docs."
        )
    logger.info("question json schema okay")

    # upload answer sheet
    uploaded_answersheet = client.files.upload(
        file = answer_pdf.file,
        config = dict(mime_type='application/pdf')
    )
    logger.info("answer pdf uploaded")

    # TODO: send question json as text directly instead of uploading
    # upload question json
    uploaded_questionJson = client.files.upload(
        file = question_json.file,
        config = dict(mime_type='application/json')
    )
    logger.info("question json uploaded")

    # make request to model
    interaction = client.interactions.create(
        model="gemini-3.5-flash",
        store = False,
        input=[
            {
                "type": "document",
                "uri": uploaded_answersheet.uri,
                "mime_type": "application/pdf"
            },
            {
                "type":"document",
                "uri": uploaded_questionJson.uri,
                "mime_type":"application/json"
            },
            {"type": "text", "text": evaluation_prompt}
        ],
        response_format = {
            "type":"text",
            "mime_type":"application/json",
            "schema":EvaluationOutput.model_json_schema()
        }
    )
    logger.info("gemini interaction created")

    # make sure the files dont accumulate
    client.files.delete(name = uploaded_questionJson.name)
    client.files.delete(name = uploaded_answersheet.name)
    logger.info("uploaded files deleted")

    # validate the output and return json
    eval_json = EvaluationOutput.model_validate_json(interaction.output_text)
    logger.info("json file loaded")

    return eval_json