from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# -----------------------------------------------------
# Base model (reject unknown fields)
# -----------------------------------------------------

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


# -----------------------------------------------------
# Common Models
# -----------------------------------------------------

class LocalizedText(StrictModel):
    en: Optional[str] = None
    hi: Optional[str] = None


class LocalizedStringList(StrictModel):
    en: Optional[List[str]] = None
    hi: Optional[List[str]] = None


class ChoiceInformation(StrictModel):
    detailedDescription: Optional[str] = None
    summary: Optional[str] = None


class Option(StrictModel):
    optionId: str
    text: LocalizedText


class MatchItem(StrictModel):
    en: Optional[str] = None
    hi: Optional[str] = None


class MatchData(StrictModel):
    matchFrom: Optional[List[MatchItem]] = None
    matchTo: Optional[List[MatchItem]] = None


class Attachment(StrictModel):
    type: Optional[str] = None
    description: Optional[str] = None


class ChoiceDefinition(StrictModel):
    targetNodes: Optional[List[str]] = None
    detailedDescription: Optional[str] = None
    summary: Optional[str] = None


# -----------------------------------------------------
# Question Models
# -----------------------------------------------------


class Question(StrictModel):
    id: str
    type: str
    text: LocalizedText

    options: Optional[List[Option]] = None
    matchData: Optional[MatchData] = None

    marks: str

    attachments: Optional[List[Attachment]] = None

    rubric: List[str]

    choiceInformation: Optional[ChoiceInformation] = None

    children: Optional[List[Question]] = None


# -----------------------------------------------------
# Section
# -----------------------------------------------------

class Section(StrictModel):
    sectionId: str

    sectionChoices: Optional[List[ChoiceDefinition]] = None

    sectionInstructions: Optional[LocalizedText] = None

    questions: List[Question]


# -----------------------------------------------------
# Metadata
# -----------------------------------------------------

class PaperMetadata(StrictModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    examType: Optional[str] = None
    duration: Optional[str] = None
    totalMarks: Optional[int] = None
    instructions: Optional[LocalizedStringList] = None


class ParsingStatus(StrictModel):
    success: Optional[bool] = None
    paperClarity: Optional[str] = None
    confidence: Optional[float] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None


# -----------------------------------------------------
# Root Model
# -----------------------------------------------------

class QuestionPaper(StrictModel):
    paperMetadata: PaperMetadata
    parsingStatus: ParsingStatus
    sections: List[Section]
    globalChoices: List[ChoiceDefinition]