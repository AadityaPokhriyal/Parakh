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

---

## 🗂️ Field Definitions

### 1. `paperMetadata`
Contains general administrative information about the exam paper:
* **`title`**: Exam paper code, set, or series.
* **`subject`**: Subject name.
* **`examType`**: e.g., "CBSE Board Examination".
* **`duration`**: Time allowed for the exam.
* **`totalMarks`**: Aggregated sum of maximum achievable marks.
* **`instructions`**: List of rules or instructions as written on the paper.

### 2. `parsingStatus`
Tracks the quality of the OCR process and extraction reliability:
* **`success`**: Overall parsing success boolean.
* **`paperClarity`**: Clarity rating (`"clear"`, `"partially_clear"`, or `"unclear"`).
* **`confidence`**: Degree of certainty (value between `0` and `1`).
* **`errors`** / **`warnings`**: Logs for critical failures or non-fatal extraction warnings.

### 3. `questions`
A recursive tree structure containing the actual questions:
* **`id`**: Unique hierarchical identifier (e.g., `Q1` -> `Q1.a` -> `Q1.a.i`).
* **`text`**: Verbatim OCR text. *Do not paraphrase or correct grammar.*
* **`marks`**:
  * For **leaf nodes** (no children): Write the exact marks allocated (e.g., `"2"`).
  * For **parent nodes** (has children): Must write `"infer from children and choice description"`. Do not aggregate or duplicate marks.
* **`attachments`**: Contains associated visual elements (e.g., `diagram` or `table` structures).
* **`ruberic`**: Mapped marking criteria (always initialized to `[]`).
* **`children`**: Recursive list of sub-questions. Must be `[]` (never `null`) if there are no sub-questions.

### 4. `choiceInformation`
Contains descriptions of optional questions and internal choices:
* **`detailedDescription`**: Plain-text description of which questions are optional.
* **`summary`**: A structured brief summary format: e.g., `(Q1.a OR Q1.b), (Q2.a OR Q2.b)`.

---

## ⚙️ Strict Hierarchical Rules

To ensure a deterministic, machine-readable tree structure, the following rules must be strictly adhered to:

### 🚫 Character Cleanup
* **Quotation Marks**: Ignore double quotation marks `"` and do not include them in the OCR text.

### 🌳 Parent vs. Child Node Rules
* **Rule 1 (Organizational Containers)**: Parent nodes are structural containers only. If a question's content exists entirely inside its children, the parent node's `text` field **MUST** be empty (`""`).
* **Rule 2 (Sub-question Splitting)**: If a question contains numbered sub-parts—such as `(a), (b), (c)` or `(i), (ii), (iii)`—they must be extracted as separate child nodes under `children`. Do **not** duplicate or concatenate child text inside the parent's `text` field.
* **Rule 3 (Shared Scenario Text)**: Parent text exists **ONLY** when there is actual shared text (like a passage, statement, diagram prompt, or common scenario context) preceding the sub-questions. Otherwise, it must be `""`.
* **Rule 7 (Empty Intermediate Nodes)**: If the hierarchy jumps levels (e.g., `Q1` -> `(a)` -> `(i)`), any intermediate level without text (like `Q1.a`) must remain empty (`""`).

### 📎 Attachment Rules
* **Rule 4 (Lowest-Level Mapping)**: Attachments (diagrams, tables) belong to the lowest relevant node in the tree.
* **Rule 5 (No Upward Inheritance)**: Never move attachments upward or inherit them into a parent node. Keep them local to the specific sub-question they belong to.

### 🔀 Branching & Choices
* **Rule 6 (OR Choices)**: Internal choices (e.g., "Answer either A or B") create sibling branches under the parent node. Do not merge them into a single parent node.

### 🧹 Integrity & Null Checks
* **Rule 8 (Children Array)**: The `children` property must always be an array `[]`. It must **never** be `null`.
* **Rule 9 (Attachments Array)**: The `attachments` property must always be an array `[]`. It must **never** be `null`.
* **Rule 10 (Text Fidelity)**: Never invent or modify text. If a question or diagram is unreadable, preserve the clarity state and append a warning to the `warnings` array (e.g., `"Question 5 image unclear"`).
* **Rule 11 (Strict JSON Output)**: Extractor output must be valid JSON only. No surrounding markdown, explanation, or conversational text.
