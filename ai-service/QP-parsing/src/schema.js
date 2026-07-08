import { Type } from '@google/genai';

// Common choice information schema snippet
const choiceInfoSchema = {
    type: Type.OBJECT,
    properties: {
        detailedDescription: { type: Type.STRING },
        summary: { type: Type.STRING }
    }
};

// --- LEVEL 3 (Deepest sub-question) ---
const level3QuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        marks: { type: Type.STRING },
        attachments: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            } 
        },
        rubric: { type: Type.ARRAY, items: { type: Type.STRING } },
        choiceInformation: choiceInfoSchema
    },
    required: ["id", "text", "marks", "rubric"] 
};

// --- LEVEL 2 (Sub-question) ---
const level2QuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        marks: { type: Type.STRING },
        attachments: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            } 
        },
        rubric: { type: Type.ARRAY, items: { type: Type.STRING } },
        choiceInformation: choiceInfoSchema,
        children: {
            type: Type.ARRAY,
            items: level3QuestionSchema
        }
    },
    required: ["id", "text", "marks", "rubric"] 
};

// --- LEVEL 1 (Top-level question) ---
const level1QuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        marks: { type: Type.STRING },
        attachments: {
            type: Type.ARRAY,
            items: { 
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                }
            }
        },
        rubric: { type: Type.ARRAY, items: { type: Type.STRING } },
        choiceInformation: choiceInfoSchema,
        children: {
            type: Type.ARRAY,
            items: level2QuestionSchema
        }
    },
    required: ["id", "text", "marks", "rubric"] 
};

const finalPaperSchema = {
    type: Type.OBJECT,
    properties: {
        paperMetadata: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                subject: { type: Type.STRING },
                examType: { type: Type.STRING },
                duration: { type: Type.STRING },
                totalMarks: { type: Type.INTEGER },
                instructions: {
                    type: Type.OBJECT,
                    properties: {
                        en: { type: Type.ARRAY, items: { type: Type.STRING } },
                        hi: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        },
        parsingStatus: {
            type: Type.OBJECT,
            properties: {
                success: { type: Type.BOOLEAN },
                paperClarity: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                errors: { type: Type.ARRAY, items: { type: Type.STRING } },
                warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        },
        questions: {
            type: Type.ARRAY,
            items: level1QuestionSchema
        },
        globalChoices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    targetNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detailedDescription: { type: Type.STRING },
                    summary: { type: Type.STRING }
                }
            }
        }
    },
    required: ["paperMetadata", "parsingStatus", "questions", "globalChoices"]
};

export default finalPaperSchema;