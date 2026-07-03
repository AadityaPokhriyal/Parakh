# 🤖 AI Service Key Response Schemas

This document defines the JSON response structures returned by the **Python FastAPI AI Service** back to the **Express.js API Gateway** for the three critical milestones of the evaluation pipeline.

---

## 📄 1. Question Paper Parser Response

### Endpoint: `POST /ai/parse-question-paper`
* **Purpose:** Returns the list of parsed questions extracted from the exam paper PDF/Image.
* **Response Payload:**

```json
{
  "paperMetadata": {
    "title": "String - Title of the exam paper",
    "subject": "String - Subject of the exam",
    "examType": "String - Type/Format of the examination",
    "duration": "String - Duration of the exam (e.g., '2 hours')",
    "totalMarks": "Number - Maximum marks possible",
    "instructions": ["Array of Strings - General instructions verbatim"]
  },
  "parsingStatus": {
    "success": "Boolean - True if extraction is mostly reliable",
    "paperClarity": "String - 'clear' | 'partially_clear' | 'unclear'",
    "confidence": "Number - Score from 0.0 (impossible) to 1.0 (highly reliable)",
    "errors": ["Array of Strings - Critical extraction failures"],
    "warnings": ["Array of Strings - Non-fatal extraction warnings/issues"]
  },
  "questions": [
    {
      "id": "String - Unique, human-readable hierarchy identifier (e.g., 'Q1', 'Q1.a', 'Q1.a.i')",
      "text": "String - Exact OCR text of the question (empty if nested inside children)",
      "marks": "String - Exact marks (e.g., '2') or 'infer from children and choice description' if parent",
      "attachments": [
        {
          "type": "String - 'diagram' | 'table'",
          "description": "String - Detailed description of the diagram or table content",
          "headers": ["Array of Strings - Column headers if type is table (optional)"],
          "rows": [["Array of Arrays - Rows data if type is table (optional)"]]
        }
      ],
      "ruberic": ["Array - Marking criteria or grading rubric guidelines (always return [] initially)"],
      "children": ["Recursive Array - List of child sub-questions following the same structure"]
    }
  ],
  "choiceInformation": {
    "detailedDescription": "String - Comprehensive explanation of choices and optional questions",
    "summary": "String - Condensed summary of the choice structures (e.g., 'Q1.a OR Q1.b')"
  }
}
```

### 📋 Field Explanations
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `exam_id` | String | Unique identifier of the target examination session. |
| `total_questions` | Integer | Total count of questions parsed from the document. |
| `questions` | Array | List of extracted question objects. |
| `questions[].question_no` | Integer/String | Sequential identifier or label of the question. |
| `questions[].question_text` | String | Extracted text content of the question. |
| `questions[].marks` | Integer/Float | Assigned mark weightage for the question. |
| `questions[].page_no` | Integer | Page index in the question paper document where this question was located. |
| `questions[].type` | String | Nature of the question (e.g., `"descriptive"`, `"mcq"`, `"numerical"`). |
| `questions[].has_diagram_expected` | Boolean | Flag indicating whether the question instructions prompt a drawing/diagram answer. |

---



## 🧮 2. Rubric Generator Response

### Endpoint: `POST /ai/generate-rubric`
* **Purpose:** Returns structural points of marking criteria compiled by AI from the teacher's specifications.
* **Response Payload:**

it was appended in the question paper json as a array of strings in "ruberic"



## 📝 3. Student Answer Evaluation Response

### Endpoint: `POST /ai/evaluate-answers`
* **Purpose:** Returns comprehensive grading marks, diagram analysis details, and rubrics checkpoint validations for a student's answer sheet.
* **Response Payload:**

```json
{
  "studentMetadata": {
    "name": "String - Student name (empty if undetected/redacted)",
    "rollNumber": "String - Roll number (empty if undetected/redacted)",
    "examCode": "String - Subject/Exam code (e.g., '086')",
    "subject": "String - Subject name (e.g., 'SCIENCE')"
  },
  "parsingStatus": {
    "success": "Boolean - True if overall answer sheet parsing succeeded",
    "paperClarity": "String - 'clear' | 'partially_clear' | 'unclear'",
    "overallConfidence": "Number - Overall parsing confidence from 0.0 to 1.0",
    "errors": ["Array of Strings - Critical parsing error messages"],
    "warnings": ["Array of Strings - Non-critical parsing warning messages"]
  },
  "answerBlocks": [
    {
      "id": "String - Unique, human-readable hierarchy identifier matching question paper (e.g., 'Q1', 'Q7.i')",
      "sourcePages": ["Array of Numbers - 1-based page indices where the answer is found"],
      "attemptStatus": "String - 'attempted' | 'unattempted' | 'uncertain'",
      "confidence": "Number - OCR confidence for this specific block from 0.0 to 1.0",
      "errors": ["Array of Strings - Specific errors in parsing this answer block"],
      "warnings": ["Array of Strings - Specific warnings in parsing this answer block"],
      "issues": ["Array of Strings - Discrepancies or notes (e.g., skipped parts, misplaced answers)"],
      "answerSummary": "String - AI-generated summary of the student's handwritten response",
      "satisfies": ["Array of Strings - Rubric criteria met by the student's answer"],
      "missing": ["Array of Strings - Rubric criteria missing from the student's answer"],
      "earnedMarks": {
        "value": "Number - Marks awarded for this specific block (e.g., 1.5)",
        "reason": "String - Textual justification/explanation for the awarded marks"
      },
      "children": ["Recursive Array - Sub-questions answers following the same block structure"]
    }
  ],
  "invalidAnswers": ["Array - Handwritten answers or text segments that could not be mapped to any question ID"],
  "attemptSummary": {
    "totalAnswerBlocks": "Number - Total count of attempted answer blocks",
    "attemptedQuestionIds": ["Array of Strings - Flat list of all question/sub-question IDs attempted"]
  }
}
```