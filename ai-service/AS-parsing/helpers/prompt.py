## Part 1: Pydantic Model Alignment Assessment
evaluation_prompt:str = '''
You are given two inputs:
1. A student's answer sheet PDF.
2. A structured `questionStructure` JSON extracted from the question paper.

The hierarchy defined in `questionStructure` is authoritative and MUST be followed exactly. Your task is to extract, interpret, and evaluate the student's answers into the mandated response schema.

---

### CORE PROCESSING RULES

#### 1. Semantic Interpretation
* Extract ONLY content written by the student. 
* Interpret answers semantically based on intent and contextual clarity; do not rely on rigid character-level OCR transcription.
* Correctly interpret visual, mathematical, and structural elements (e.g., equations, formulas, chemical structures, diagrams, flowcharts, tables, and graphs) as meaning rather than literal symbols (e.g., transcribe an ambiguous handwriting string as "3/4" instead of "3/n4" if confidence strongly supports it).
* Do not hallucinate or invent information unsupported by the answer sheet.

#### 2. Rubric & Evaluation Logic
* If rubrics exist within `questionStructure`, use them strictly to assign marks and evaluate answer quality.
* If rubrics do not exist, evaluate answers using standard academic expectations: correctness, completeness, clarity, explanation quality, organization, relevance, use of examples, and structural flow.
* Do not rigidly depend on rubrics for the `satisfies` or `missing` assessment fields; use your overall semantic understanding of the student's answer.
* Earned marks must never exceed the maximum marks defined for that node in `questionStructure`. If parent marks are designated to be inferred from children, derive the total value dynamically.

#### 3. Parent-Child & Hierarchy Rules
* Only create block IDs that explicitly exist inside the authoritative `questionStructure`.
* Do not convert student bullets (e.g., i, ii, 1, 2, •) into new structural sub-levels unless that specific sub-hierarchy exists in the provided `questionStructure`.
* Parent nodes function as organizational containers. If content exists entirely inside child elements, the parent's `answerSummary` must be an empty string `""`.
* Do not duplicate text content across parent and child nodes. A parent summary must only contain shared content that explicitly appears before the child answers start.
* If a question identifier is completely missing from the student sheet but an answer is present, map it sequentially using `UNMAPPED_1`, `UNMAPPED_2`, etc.
* Do not merge separated answer blocks unless structural continuity across pages is strongly supported.

#### 3A. Tree Construction Rules (Mandatory)

The `answerBlocks` output MUST be a recursive tree that exactly mirrors the hierarchy of `questionStructure`.

Construction rules:

* Every question node that exists in `questionStructure` must appear exactly once in the output tree.
* If a node has subquestions in `questionStructure`, those subquestions MUST be placed inside that node's `children` array.
* A child node MUST NEVER appear as a top-level element in `answerBlocks`.
* Every answer block has exactly one parent except true root questions.
* The order of `children` must match the order defined in `questionStructure`.
* The `children` array recursively follows the same schema as its parent.
* Continue nesting until the deepest level of `questionStructure` only.
* Do not flatten nested questions into sibling answer blocks.
* Match the exact `id` string format provided in `questionStructure` (e.g., if it uses "Q1.a", use "Q1.a"; Do not alter or reinvent the ID keys.

#### 4. Optional Questions & Conflicts
* If a student attempts mutually exclusive optional questions, use the `choiceInformation` and rules within `questionStructure` to determine validity.
* Mark only the excess or conflicting attempts as invalid, and isolate their IDs within the `invalidAnswers` array. Do not include these invalid IDs inside the active `answerBlocks` tree or the `attemptSummary` counts.

#### 5. Output Field Content Expectations
* `answerSummary`: A concise semantic summary of what the student wrote. Do not write an ideal/textbook answer, and do not improve the student's quality of phrasing.
* `satisfies`: Specific items or concepts the student successfully covered to earn marks.
* `missing`: Missing, incomplete, or weak components based on the exam level, marks allocated, and expectations. Avoid overly granular deductions unless explicitly expected by the question text.
* `errors` / `warnings` / `issues`: Populate these arrays with processing anomalies, such as "handwriting_unclear", "page tilted", or missing text boundaries. If none occur, return empty arrays.

---

### EXECUTION PIPELINE
Perform the extraction systematically using the following internal passes before finalizing the output schema:
* Pass 1: Identify all answer regions, question boundaries, handwritten identifiers, optional choices, and visual components across all pages.
* Pass 2: Verify structural hierarchy, question continuity across page breaks, and resolve semantic ambiguities.
* Pass 3: Apply rubric-based scoring or fallback academic evaluation to calculate exact values and write evaluation justifications.
* Pass 4: Construct the final hierarchical tree matching `questionStructure`.
* Pass 5: Validate data consistency across metadata totals and structural boundaries.

### MANDATORY OUTPUT STRUCTURE REMINDER
Your `answerBlocks` output must strictly follow a nested tree architecture. Sub-questions must NEVER sit at the root level of the array:

CORRECT NESTED ARCHITECTURE EXAMPLE:
{
  "answerBlocks": [
    {
      "id": "Q1",
      "answerSummary": "Parent question content...",
      "children": [
        {
          "id": "Q1.a",
          "answerSummary": "Child question content...",
          "children": []
        }
      ]
    }
  ]
}
'''

