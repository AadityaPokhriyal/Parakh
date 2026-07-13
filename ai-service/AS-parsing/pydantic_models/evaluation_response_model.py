from __future__ import annotations
from enum import Enum
from typing import List
from pydantic import BaseModel, Field

class PaperClarity(str, Enum):
    CLEAR = "clear"
    PARTIALLY_CLEAR = "partially_clear"
    UNCLEAR = "unclear"

class AttemptStatus(str, Enum):
    ATTEMPTED = "attempted"
    PARTIAL = "partial"
    CROSSED_OUT = "crossed_out"
    UNCERTAIN = "uncertain"

class StudentMetadata(BaseModel):
    # Removed defaults to force Gemini to populate empty strings if not found
    name: str
    rollNumber: str
    examCode: str
    subject: str

class EarnedMarks(BaseModel):
    value: float = Field(description="Marks awarded for this answer.")
    reason: str = Field(description="Short explanation for marks awarded or deducted.")

class ParsingStatus(BaseModel):
    success: bool
    paperClarity: PaperClarity
    overallConfidence: float = Field(ge=0, le=1)
    errors: List[str]  # Required list
    warnings: List[str]

class GrandchildAnswerBlock(BaseModel):
    id: str = Field(description="The exact grandchild ID, e.g., 'Q11.b.i' or Q7.ii.b etc")
    sourcePages: List[int]
    attemptStatus: AttemptStatus
    confidence: float = Field(ge=0, le=1)
    errors: List[str]
    warnings: List[str]
    issues: List[str]
    answerSummary: str = Field(description="Concise semantic understanding of the student's answer.")
    satisfies: List[str]
    missing: List[str]
    earnedMarks: EarnedMarks
    children: List[None] = Field(
        default=[],
        description="Leaf node tier. Grandchild items must always have an empty array here as they cannot possess further children."
    )


class ChildAnswerBlock(BaseModel):
    id: str = Field(description="The exact child ID, (e.g., 'Q7.i', 'Q11.a').")
    sourcePages: List[int]
    attemptStatus: AttemptStatus
    confidence: float = Field(ge=0, le=1)
    errors: List[str]
    warnings: List[str]
    issues: List[str]
    answerSummary: str = Field(description="Concise semantic understanding of the student's answer.")
    satisfies: List[str]
    missing: List[str]
    earnedMarks: EarnedMarks
    children: List[GrandchildAnswerBlock] = Field(
        default=[],
        description="Array containing Tier-3 subpart blocks (Grandchild items like 'Q11.b.i'). Leave empty if this child block does not split further."
    )


class RootAnswerBlock(BaseModel):
    id: str = Field(description="The main root question identifier ONLY (e.g., 'Q1', 'Q7', 'Q11'). Sub-questions must NEVER be placed here.")
    sourcePages: List[int]
    attemptStatus: AttemptStatus
    confidence: float = Field(ge=0, le=1)
    errors: List[str]
    warnings: List[str]
    issues: List[str]
    answerSummary: str = Field(description="Shared context for the main question. Empty string if content is purely inside children.")
    satisfies: List[str]
    missing: List[str]
    earnedMarks: EarnedMarks
    children: List[ChildAnswerBlock] = Field(
        default=[],
        description="CRITICAL: All sub-questions, sub-parts, or items (like Q7.i, Q11.a) belonging to this root question MUST be nested inside this array."
    )

class AttemptSummary(BaseModel):
    totalAnswerBlocks: int
    attemptedQuestionIds: List[str]

class EvaluationOutput(BaseModel):
    studentMetadata: StudentMetadata
    parsingStatus: ParsingStatus
    answerBlocks: List[RootAnswerBlock] = Field(
        description="A list containing ONLY the true top-level root questions (e.g., Q1, Q2, Q7). Every single sub-part must reside inside the children array of its respective RootAnswerBlock."
    )
    invalidAnswers: List[str]
    attemptSummary: AttemptSummary