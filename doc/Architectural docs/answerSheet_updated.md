# 📋 Answer Sheet JSON Schema & Evaluation Rules (Updated 3-Tier Structure)

This document describes the structured JSON schema and the rules used to represent, validate, and evaluate parsed student answer sheets. It has been updated to reflect the strictly-typed 3-tier Pydantic schema structure: **Root -> Child -> Grandchild**.

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
      "id": "String - The main root question identifier ONLY (e.g., 'Q1', 'Q7', 'Q11'). Sub-questions must NEVER be placed here.",
      "sourcePages": ["Array of Numbers - 1-based page indices where the answer is found"],
      "attemptStatus": "String - 'attempted' | 'partial' | 'crossed_out' | 'uncertain'",
      "confidence": "Number - Extraction confidence for this block from 0.0 to 1.0",
      "errors": ["Array of Strings - Specific errors in parsing this answer block"],
      "warnings": ["Array of Strings - Specific warnings in parsing this answer block"],
      "issues": ["Array of Strings - Discrepancies or notes (e.g., skipped parts, misplaced answers)"],
      "answerSummary": "String - Shared context for the main question. Empty string if content is purely inside children.",
      "satisfies": ["Array of Strings - Rubric criteria/points met by the student's answer"],
      "missing": ["Array of Strings - Rubric criteria/points missing or weak in the student's answer"],
      "earnedMarks": {
        "value": "Number - Marks awarded (must not exceed max marks in questionStructure)",
        "reason": "String - Short explanation for the awarded or docked marks"
      },
      "children": [
        {
          "id": "String - The exact child ID (e.g., 'Q7.i', 'Q11.a').",
          "sourcePages": ["Array of Numbers - 1-based page indices where the answer is found"],
          "attemptStatus": "String - 'attempted' | 'partial' | 'crossed_out' | 'uncertain'",
          "confidence": "Number - Extraction confidence for this block from 0.0 to 1.0",
          "errors": ["Array of Strings"],
          "warnings": ["Array of Strings"],
          "issues": ["Array of Strings"],
          "answerSummary": "String - Concise semantic understanding of the student's answer.",
          "satisfies": ["Array of Strings"],
          "missing": ["Array of Strings"],
          "earnedMarks": {
            "value": "Number",
            "reason": "String"
          },
          "children": [
            {
              "id": "String - The exact grandchild ID (e.g., 'Q11.b.i').",
              "sourcePages": ["Array of Numbers - 1-based page indices where the answer is found"],
              "attemptStatus": "String - 'attempted' | 'partial' | 'crossed_out' | 'uncertain'",
              "confidence": "Number - Extraction confidence for this block from 0.0 to 1.0",
              "errors": ["Array of Strings"],
              "warnings": ["Array of Strings"],
              "issues": ["Array of Strings"],
              "answerSummary": "String - Concise semantic understanding of the student's answer.",
              "satisfies": ["Array of Strings"],
              "missing": ["Array of Strings"],
              "earnedMarks": {
                "value": "Number",
                "reason": "String"
              },
              "children": []
            }
          ]
        }
      ]
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

### 3. `answerBlocks` (Strictly 3-Tier Hierarchy)
Instead of an infinitely recursive structure, the evaluation output is restricted to exactly **three tiers** of answer blocks to provide structural predictability for parsing, downstream validation, and frontend rendering:

#### A. Root Question Block (Tier 1: `RootAnswerBlock`)
Contains only the top-level main questions (e.g., `Q1`, `Q7`, `Q11`).
* **`id`**: The main root question identifier ONLY (e.g., `Q1`, `Q7`, `Q11`). Sub-questions must never be placed here.
* **`answerSummary`**: Shared context for the main question. If the content is purely inside child elements, this should be set to an empty string `""`.
* **`children`**: Array of **ChildAnswerBlock** structures representing the immediate subparts of the root question.

#### B. Child Question Block (Tier 2: `ChildAnswerBlock`)
Contains immediate subparts or sub-questions (e.g., `Q7.i`, `Q11.a`).
* **`id`**: The exact child question identifier (e.g., `Q7.i`, `Q11.a`).
* **`answerSummary`**: Concise semantic understanding of the student's answer for this part.
* **`children`**: Array of **GrandchildAnswerBlock** structures. If no further subdivision exists, this should be an empty list `[]`.

#### C. Grandchild Question Block (Tier 3: `GrandchildAnswerBlock` - Leaf Nodes)
Contains the deepest allowed level of question subparts (e.g., `Q11.b.i`).
* **`id`**: The exact grandchild question identifier (e.g., `Q11.b.i`).
* **`answerSummary`**: Concise semantic understanding of the student's answer for this deep subpart.
* **`children`**: Always an empty list `[]`. No further nested children are permitted under this level.

---

### Core Block Properties (Common across all Tier blocks)
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
* **`missing`**: List of likely missing, incomplete, or weak components.
* **`earnedMarks`**:
  * **`value`**: Numerical score awarded. Must never exceed maximum marks defined in `questionStructure`.
  * **`reason`**: Short explanation explaining why marks were awarded or docked.

---

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
* **No Hallucinations:** Do not hallucinate missing information or invent content unsupported by the answer sheet.

### 🎯 Rubric Rules
* **With Rubrics:** If rubrics exist inside `questionStructure`, use them when assigning marks and evaluating answer quality.
* **Without Rubrics:** If rubrics do not exist, evaluate answers using normal academic expectations.
* **Semantic Flex:** Do not rigidly depend on rubrics for `satisfies` or `missing` fields. Use overall semantic understanding.

### 🌳 Hierarchical & Question Structure Rules
* **Authority:** `questionStructure` is the single source of truth.
* **Valid IDs Only:** Only create IDs that exist inside `questionStructure`. Never invent hierarchy.
* **Maximum Depth (3 Tiers):** The structure is limited to a maximum depth of three tiers (`Root` -> `Child` -> `Grandchild`). Do not generate hierarchy levels deeper than the third tier (e.g. no `GreatGrandchild` block). Any leaf subparts at the third level must not possess further children.
* **Student Bullets:** Student bullets (`i.`, `ii.`, `iii.`, `1.`, `2.`, `•`, `-`) inside handwritten answers are content only. Do NOT convert them into hierarchy/child nodes unless that hierarchy already exists in `questionStructure`.

### 👨‍👧 Parent–Child Rules
* **Rule 1 (Parent Container):** Parent nodes are organizational containers. If content exists entirely inside children, the parent's `answerSummary` must be `""`.
* **Rule 2 (No Duplication):** Do not duplicate content across parent and child nodes.
* **Rule 3 (Parent Summary Condition):** Parent summary exists only if shared context is explicitly written before child answers.
* **Rule 4 (Children Array):** `children` must always be `[]` when there are no subparts, never `null`.
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
