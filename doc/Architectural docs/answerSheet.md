# 📋 Answer Sheet JSON Schema & Evaluation Rules

This document describes the structured JSON schema and the rules used to represent, validate, and evaluate parsed student answer sheets. It serves as the official spec for both the **AI Service** and the **Frontend/Client Application** content display.

---

## 🏗️ General JSON Structure

The parsed and evaluated student answer sheet is represented as a single JSON object structured as follows:

```json
{
  "studentMetadata": {
    "name": "String - Student name (empty if undetected/redacted)",
    "rollNumber": "String - Roll number (empty if undetected/redacted)",
    "examCode": "String - Subject/Exam code (e.g., '086')",
    "subject": "String - Subject name (e.g., 'SCIENCE')"
  },
  "parsingStatus": {
    "success": "Boolean - true if extraction is mostly reliable",
    "paperClarity": "String - 'clear' | 'partially_clear' | 'unclear'",
    "overallConfidence": "Number - Score from 0.0 to 1.0",
    "errors": ["Array of Strings - Critical parsing error messages"],
    "warnings": ["Array of Strings - Non-critical parsing warning messages"]
  },
  "answerBlocks": [
    {
      "id": "String - Unique hierarchical identifier matching question structure (e.g., 'Q1', 'Q7.i')",
      "sourcePages": ["Array of Numbers - 1-based page indices where the answer is found"],
      "attemptStatus": "String - 'attempted' | 'partial' | 'crossed_out' | 'uncertain'",
      "confidence": "Number - Extraction confidence for this block from 0.0 to 1.0",
      "errors": ["Array of Strings - Specific errors in parsing this answer block"],
      "warnings": ["Array of Strings - Specific warnings in parsing this answer block"],
      "issues": ["Array of Strings - Discrepancies or notes (e.g., skipped parts, misplaced answers)"],
      "answerSummary": "String - Concise semantic summary of what the student wrote",
      "satisfies": ["Array of Strings - Rubric criteria/points met by the student's answer"],
      "missing": ["Array of Strings - Rubric criteria/points missing or weak in the student's answer"],
      "earnedMarks": {
        "value": "Number - Marks awarded (must not exceed max marks in questionStructure)",
        "reason": "String - Short explanation for the awarded or docked marks"
      },
      "children": ["Recursive Array - Sub-questions answers following the same block structure"]
    }
  ],
  "invalidAnswers": ["Array of Strings - IDs of redundant attempts from optional question conflicts"],
  "attemptSummary": {
    "totalAnswerBlocks": "Number - Total count of valid answer nodes extracted (excluding invalidAnswers)",
    "attemptedQuestionIds": ["Array of Strings - Flat list of valid identified question IDs (excluding invalidAnswers)"]
  }
}
```

---

## 🗂️ Field Definitions

### 1. `studentMetadata`
General information about the student if present on the answer sheet.
* **`name`**: Student name (extract only explicitly visible information; do not infer missing values).
* **`rollNumber`**: Student roll number (extract only explicitly visible information; do not infer missing values).
* **`examCode`**: Subject/exam code (e.g., `"086"`).
* **`subject`**: Subject name (e.g., `"SCIENCE"`).

### 2. `parsingStatus`
Global quality status of the scanned paper and OCR transcription:
* **`success`**: `true` if extraction is mostly reliable; `false` if major extraction failures exist.
* **`paperClarity`**: Overall answer sheet readability rating. Allowed values: `"clear"`, `"partially_clear"`, `"unclear"`.
* **`overallConfidence`**: Score from `0.0` (impossible) to `1.0` (highly reliable) representing overall extraction certainty, factoring in handwriting readability, page quality, hierarchy certainty, and semantic interpretation certainty.
* **`errors`**: Critical failures affecting extraction (e.g., `["Page 3 unreadable", "Question numbering missing"]`). Must always exist; use `[]` if none.
* **`warnings`**: Non-critical issues (e.g., `["handwriting_unclear", "page tilted", "partial text overlap"]`). Must always exist; use `[]` if none.

### 3. `answerBlocks`
A recursive structure mirroring the question paper hierarchy, housing the student's responses, criteria mapping, and awarded marks:
* **`id`**: Use question hierarchy matching `questionStructure` exactly (e.g., `Q1`, `Q1.a`, `Q1.a.i`, `Q1.a.i.A`). If question identifier is unavailable, assign `UNMAPPED_1`, `UNMAPPED_2`, etc.
* **`sourcePages`**: Page numbers (1-indexed) where the answer appears (e.g., `[2]` or `[2,3]`). Must always exist.
* **`attemptStatus`**: Observed state of the answer attempt. Allowed values:
  * `"attempted"`: Answer clearly written.
  * `"partial"`: Answer started but incomplete.
  * `"crossed_out"`: Answer intentionally cancelled.
  * `"uncertain"`: Attempt presence unclear.
* **`confidence`**: Score from `0.0` to `1.0` representing extraction confidence for this answer block, including handwriting, hierarchy, semantic, and answer boundary certainty.
* **`errors`**: Localized block parsing errors. Must always exist; use `[]` if none.
* **`warnings`**: Localized block parsing warnings (e.g., `"handwriting_unclear"`). Must always exist; use `[]` if none.
* **`issues`**: Short descriptions of answer extraction or interpretation problems (e.g., `["Answer partially cut near page edge", "Question number uncertain"]`). Must always exist; use `[]` if none.
* **`answerSummary`**: Concise semantic understanding of what the student wrote.
  > [!IMPORTANT]
  > **Fidelity Warning:** Do NOT rewrite the summary as an ideal answer, improve its quality, add external info, or build a textbook answer. It must only summarize the actual content.
  > * **Correct:** `"Defines operating system and lists functions such as memory management and scheduling"`
  > * **Wrong:** `"An operating system is system software that manages computer resources..."`
* **`satisfies`**: List of answer components/grading criteria successfully covered. Deserving of marks.
  * *Note:* Do not copy directly from rubrics; use semantic understanding.
  * *Example:* `["Correct definition provided", "Relevant example included", "Diagram labeled correctly"]`
* **`missing`**: List of likely missing, incomplete, or weak components.
  * *Note:* Based on examination level, question expectations, marks, rubrics (if available), and answer content. Do not invent deductions unsupported by context; avoid overly granular deductions.
  * *Correct:* `["Explanation incomplete", "No example provided"]`
  * *Wrong:* `["Kernel architecture not discussed", "Interrupt handling absent"]` (unless explicitly expected).
* **`earnedMarks`**:
  * **`value`**: Numerical score awarded. Must never exceed maximum marks defined in `questionStructure`. If parent marks are `"infer from children and choice description"`, value must be derived from child nodes.
  * **`reason`**: Short explanation explaining why marks were awarded or docked.
    * *Correct:* `"Definition correct but explanation incomplete"`
    * *Wrong:* `"Student attempted the question in a reasonably good manner..."`
* **`children`**: Recursive list of sub-answers. Must always exist; use `[]` if none (never `null`).

### 4. `invalidAnswers`
Contains IDs of redundant/excess answers resulting from optional/choice question conflicts. Do not include valid answers here.
* *Example:* `["Q5.b", "Q8.c"]`

### 5. `attemptSummary`
Summary of student's attempts:
* **`totalAnswerBlocks`**: Total number of valid answer nodes extracted (do not count `invalidAnswers`).
* **`attemptedQuestionIds`**: Contains IDs of valid identified answers only (do not include `invalidAnswers`).

---

## ⚙️ Core Processing & Evaluation Rules

The AI Service and validation pipeline must adhere strictly to the following rules:

### 📝 General Extraction Rules
* **Student-Written Only:** Extract ONLY student-written content.
* **Semantic Interpretation:** Interpret answers semantically. Do NOT preserve OCR text exactly and do NOT force character-level transcription.
* **Visual/Scientific Content:** Correctly interpret equations, formulas, chemical structures, diagrams, flowcharts, tables, graphs, and mathematical expressions as meaning rather than literal symbols.
  * *Example:* Transcribe a poorly written symbol as `3/4` instead of `3/n4` if confidence strongly supports it. Use semantic interpretation for handwriting ambiguity.
* **No Hallucinations:** Do not hallucinate missing information or invent content unsupported by the answer sheet.

### 🎯 Rubric Rules
* **With Rubrics:** If rubrics exist inside `questionStructure`, use them when assigning marks and evaluating answer quality.
* **Without Rubrics:** If rubrics do not exist, evaluate answers using normal academic expectations: *correctness, completeness, clarity, explanation quality, organization, relevance, examples, presentation quality, logical structure, bullet usage (when appropriate), and answer length relative to marks*.
* **Semantic Flex:** Do not rigidly depend on rubrics for `satisfies` or `missing` fields. Use overall semantic understanding.

### 🌳 Hierarchical & Question Structure Rules
* **Authority:** `questionStructure` is the single source of truth.
* **Valid IDs Only:** Only create IDs that exist inside `questionStructure`. Never invent hierarchy.
* **Student Bullets:** Student bullets (`i.`, `ii.`, `iii.`, `1.`, `2.`, `•`, `-`) inside handwritten answers are content only. Do NOT convert them into hierarchy/child nodes unless that hierarchy already exists in `questionStructure`.

### 👨‍👧 Parent–Child Rules
* **Rule 1 (Parent Container):** Parent nodes are organizational containers. If content exists entirely inside children, the parent's `answerSummary` must be `""`.
* **Rule 2 (No Duplication):** Do not duplicate content across parent and child nodes.
  * *Example:* `Q1.answerSummary = ""` and `Q1.a.answerSummary = "actual content"`.
* **Rule 3 (Parent Summary Condition):** Parent summary exists only if shared content exists before child answers.
* **Rule 4 (Children Array):** `children` must always be `[]`, never `null`.
* **Rule 5 (Errors Array):** `errors` must always be `[]`, never `null`.
* **Rule 6 (Warnings Array):** `warnings` must always be `[]`, never `null`.
* **Rule 7 (Handwriting Warning):** If handwriting uncertainty exists, extract the best semantic interpretation and append `"handwriting_unclear"` to the block's `warnings` array.
* **Rule 8 (Multi-Page Answers):** If an answer spans multiple pages, include all page numbers in `sourcePages` (e.g., `[2,3]`).
* **Rule 9 (Unidentified Answers):** If a question identifier is missing, assign sequential IDs like `UNMAPPED_1`, `UNMAPPED_2`, `UNMAPPED_3`.
* **Rule 10 (Separated Blocks):** Do not merge separated answer blocks unless continuity is strongly supported.

### 🔀 Optional Question Rules
* **Conflict Resolution:** If a student attempts mutually exclusive optional questions, determine validity using `choiceInformation` and `questionStructure` rules.
* **Excess Attempts:** Mark only excess or conflicting attempts as invalid.
* **Exclusion:** Do not include invalid attempts in `answerBlocks`. Store their IDs inside the `invalidAnswers` array.
