# 📋 Question Paper JSON Schema & Extraction Rules

This document describes the structured JSON schema and the strict hierarchical rules used to represent and validate parsed question papers.

---

## 🏗️ General JSON Structure

The parsed question paper is represented as a single JSON object structured as follows:

```json
{
  "paperMetadata": {
    "title": "String - Title of the exam paper",
    "subject": "String - Subject of the exam",
    "examType": "String - Type/Format of the examination",
    "duration": "String - Duration of the exam (e.g., '2 hours')",
    "totalMarks": "Number - Maximum marks possible",
    "instructions": {
      "en": ["Array of Strings - General English instructions verbatim"],
      "hi": ["Array of Strings - General Hindi instructions verbatim"]
    }
  },
  "parsingStatus": {
    "success": "Boolean - True if extraction is mostly reliable",
    "paperClarity": "String - 'clear' | 'partially_clear' | 'unclear'",
    "confidence": "Number - Score from 0.0 (impossible) to 1.0 (highly reliable)",
    "errors": ["Array of Strings - Critical extraction failures"],
    "warnings": ["Array of Strings - Non-fatal extraction warnings/issues"]
  },
  "sections": [
    {
      "sectionId": "String - Identifier for the section (e.g., 'A', '3', 'i', 'II')",
      "sectionChoices": [
        {
          "targetNodes": ["Array of Strings - Level 1 question IDs involved in the choice"],
          "detailedDescription": "String - Comprehensive explanation of the choice logic",
          "summary": "String - Condensed summary of the section choices"
        }
      ],
      "sectionInstructions": {
        "en": "String - Specific English instruction for this section",
        "hi": "String - Specific Hindi instruction for this section"
      },
      "questions": [
        {
          "id": "String - Unique, human-readable hierarchy identifier (e.g., 'Q1', 'Q1.a', 'Q1.a.i')",
          "type": "String - 'MCQ' | 'MTF' | 'Theory' | 'Hybrid'",
          "text": {
            "en": "String - Exact OCR text of the question in English",
            "hi": "String - Exact OCR text of the question in Hindi"
          },
          "marks": "String - Exact marks (e.g., '2') or 'infer from children and choice description' if parent node",
          "extractedTotalMarks":"String - Total Marks linked to that Independent top level question.",
          "rubric": ["Array - Marking criteria or grading rubric guidelines (always return [])"],
          "attachments": [
            {
              "type": "String - Type of asset (e.g., diagram, graph, image)",
              "description": "String - Complete, lossless visual data extraction capturing all coordinates, data points, labels, and text snippets"
            }
          ],
          "diagramRequired":"Boolean-which is set to true if a question states to draw a visual artifact. It should follow the rule as expressed in the strict rule `RULE 12`.",
          "options": [
            {
              "optionId": "String - Identifier for the option (e.g., 'A', 'B')",
              "text": {
                "en": "String - English text or detailed visual description of the option",
                "hi": "String - Hindi text or detailed visual description of the option"
              }
            }
          ],
          "matchData": {
            "matchFrom": [
              {
                "en": "String - Left column item text/description in English",
                "hi": "String - Left column item text/description in Hindi"
              }
            ],
            "matchTo": [
              {
                "en": "String - Right column item text/description in English",
                "hi": "String - Right column item text/description in Hindi"
              }
            ]
          },
          "choiceInformation": {
            "detailedDescription": "String - Plain-text description of immediate sub-question choices",
            "summary": "String - Structured brief summary format of immediate choices"
          },
          "children": ["Recursive Array - List of child sub-questions following the level-specific hierarchy"]
        }
      ]
    }
  ],
  "globalChoices": [
    {
      "targetNodes": ["Array of Strings - Section IDs involved in cross-section choices"],
      "detailedDescription": "String - Comprehensive explanation of choices between independent sections",
      "summary": "String - Condensed summary of inter-section choice structures"
    }
  ]
}
```

#🗂️ Field Definitions
## 1. paperMetadata
Contains general administrative information about the exam paper. Use empty strings or 0 for totalMarks if unavailable:
- title: Exam paper title, code, set, or series.
- subject: Subject name.examType: e.g., "CBSE Board Examination".
- duration: Time allowed for the exam.totalMarks: Aggregated sum of maximum achievable marks.
- instructions: Bilingual object containing array lists of rules as written on the paper mapped by language keys (en and hi).

## 2. parsingStatusTracks the quality of the OCR process and extraction reliability:
- success: Overall parsing success boolean.
- paperClarity: Clarity rating ("clear", "partially_clear", or "unclear").
- confidence: Degree of certainty (value between 0.0 and 1.0).
- errors / warnings: Logs for critical extraction failures or non-fatal issues (e.g., unreadable snippets).

## 3. sections
An array containing top-level structural subdivisions of the paper:
- sectionId: Label identifying the section (e.g., "A", "II", "3").
- sectionChoices: List tracking choices restricted strictly to level 1 main questions within this section.
- sectionInstructions: Specific context or instructional notes bounded strictly to this section mapped via language keys.
- questions: Array of Level 1 main question objects nested inside this section.

## 4. Question Properties (Recursive Node Structure)
- id: Unique hierarchical identifier mapping structure (e.g., Level 1: Q1 $\rightarrow$ Level 2: Q1.a $\rightarrow$ Level 3: Q1.a.i).
- type: Category string classified strictly as "MCQ", "MTF", "Theory", or "Hybrid".text: Bilingual object containing the verbatim question strings mapped by en and hi. Preserve spelling mistakes and formatting exactly as printed; never paraphrase.
- marks:
  - For leaf nodes (no children): Write the exact explicitly printed numerical value (e.g., "5"). If no individual marks are printed for the sub-part, set it to "". The marks for leaf nodes are calculated later using a function marksDistributor().
  - For parent nodes (has children): Must write exactly "infer from children and choice description". Never aggregate or output numerical values here.
- extractedTotalMarks: Shows the total marks that can be awarded for solving that particular independent top level question.
- rubric: Marking criteria layer. Always return an empty array ([]).
- attachments: Array containing supporting illustrations or figures. Requires a lossless visual data extraction detailing every coordinate, variable, label, and data point.
- options: Array used ONLY for "MCQ" types containing an optionId and a bilingual text object. Contains visual descriptions if choices are graphical.
- matchData: Structural configuration used ONLY for "MTF" types. Maps left column items (matchFrom) and right column items (matchTo) as bilingual text arrays.
- choiceInformation: Handles internal choices confined strictly to the node's immediate child sub-questions (Level 2 or Level 3).
- children: Array of sub-question objects mapping out the question hierarchy. Level 1 strictly contains Level 2 objects; Level 2 strictly contains Level 3 objects. Level 3 nodes do not support further nesting.

## 5. globalChoices
Array of objects handling structural dependencies specifically for independent choices between different sections.


# ⚙️ Strict Hierarchical Rules

## 🧹 Omission & Integrity Rules

- Rule 1 (Data-driven Omission): If optional schema keys (children, attachments, options, matchData, choiceInformation) contain no data, OMIT the key entirely from the object. Do not output them as null or empty arrays.

- Rule 2 (Fidelity Constraint): Never invent or modify missing text. If any component is unreadable, preserve the clarity state and append a clear descriptive log to the root warnings array (e.g., "Question 5 image unclear").

## 🌳 Parent vs. Child Node Rules

- Rule 3 (No Questions as Sections): Questions must never be treated as sections. If a question paper has no explicit sections, the entire question paper will be treated as one single section object encapsulating the questions array.

- Rule 4 (Empty Strings for Textless Parents): Parent nodes without unique text must have empty strings for all language tags inside the text block (e.g., "text": {"en": "", "hi": ""}). Do not duplicate or consolidate child content into the parent text block.

- Rule 5 (Parent Text Context): Parent text exists ONLY when there is actual shared text or introductory context written before children (e.g., Paragraph blocks or instructions like "Explain in brief:").

- Rule 6 (Empty Intermediate Nodes): Keep hierarchy strict (Q1 $\rightarrow$ Q1.a $\rightarrow$ Q1.a.i). Intermediate levels missing explicit text remain empty strings "" inside their respective language tags.

- Rule 7 (Inline Labels and Prefixing): Do not create intermediate, content-less parent nodes out of hanging execution words or labels followed by a colon (e.g., "Calculate:", "Find:", "Given:").

 - If a main question body ends with or contains such a phrase, keep it within the parent question's text field.

 - If it introduces sub-questions, distribute the phrase prefix cleanly to the child nodes directly (e.g., Q6.a: "Calculate: Transmission delay"). Never create an artificial level just to house a single introductory word.

## 📎 Attachment Rules

- Rule 8 (Lowest-Level Mapping): Attachments belong strictly to the lowest relevant node in the hierarchy tree.

- Rule 9 (No Upward Inheritance): Never move attachments upward or inherit them into a parent node. Keep them local to the specific sub-question they reference.

## 🎨 Critical Visual Extraction Rule

- Rule 10 (Lossless Description): If a question, option, or matching item relies on a diagram, graph, matrix, or visual image, the description field must provide a complete, lossless translation. It must capture every coordinate, variable, label, text snippet, and data point shown. It must contain all information necessary for a human to solve the problem without seeing the original source image.

## 🔀 Choice Scoping & Boundaries

- Rule 11 (Choice Hierarchy Mapping): "OR", "any one", "any two" conditions create choices based on structural layout/indentation or marks:

  - Section-Level Choices (sectionChoices): Handles choices between independent, top-level (Level 1) main questions within a section (e.g., Choose Q1 OR Q2). Putting level 1 question choices into globalChoices is a critical violation.

  -Question-Level Choices (choiceInformation): Handles choices confined strictly to its immediate sub-question children (Level 2 or Level 3 nodes).

  -Inter-Section Choices (globalChoices): Handles choices strictly between independent structural sections of the paper via the targetNodes key.

## 🔒 Output Enforcement

- Rule 12 (Strict JSON Output): The extractor must output valid JSON matching the target structure only. No surrounding conversational filler, markdown syntax blocks, or outside explanations are permitted.