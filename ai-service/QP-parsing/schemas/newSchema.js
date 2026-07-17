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
        type: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    optionId: { type: Type.STRING },
                    text: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING },
                        }
                    }
                },
                required: ["optionId", "text"]
            }
        },
        matchData: {
            type: Type.OBJECT,
            properties: {
                matchFrom: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                },
                matchTo: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                }
            }
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
        diagramRequired: { type:Type.BOOLEAN },
    },
    required: ["type", "id", "text", "marks", "rubric","diagramRequired"] 
};

// --- LEVEL 2 (Sub-question) ---
const level2QuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    optionId: { type: Type.STRING },
                    text: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING },
                        }
                    }
                },
                required: ["optionId", "text"]
            }
        },
        matchData: {
            type: Type.OBJECT,
            properties: {
                matchFrom: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                },
                matchTo: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                }
            }
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
        diagramRequired: { type:Type.BOOLEAN },
        children: {
            type: Type.ARRAY,
            items: level3QuestionSchema
        }
    },
    required: ["type", "id", "text", "marks", "rubric","diagramRequired"] 
};

// --- LEVEL 1 (Top-level question) ---
const level1QuestionSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING },
        text: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING },
            },
        },
        options: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    optionId: { type: Type.STRING },
                    text: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING },
                        }
                    }
                },
                required: ["optionId", "text"]
            }
        },
        matchData: {
            type: Type.OBJECT,
            properties: {
                matchFrom: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                },
                matchTo: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            en: { type: Type.STRING },
                            hi: { type: Type.STRING }
                        }
                    }
                }
            }
        },
        marks: { type: Type.STRING },
        extractedTotalMarks:{type: Type.STRING},
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
        diagramRequired: { type:Type.BOOLEAN },
        children: {
            type: Type.ARRAY,
            items: level2QuestionSchema
        }
    },
    required: ["type", "id", "text", "marks", "rubric","extractedTotalMarks","diagramRequired"] 
};

// --- SECTION LEVEL ---
const sectionSchema = {
    type: Type.OBJECT,
    properties: {
        sectionId: { type: Type.STRING },
        sectionChoices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    targetNodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    detailedDescription: { type: Type.STRING },
                    summary: { type: Type.STRING }
                }
            }
        },
        sectionInstructions: {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                hi: { type: Type.STRING }
            }
        },
        // Level 1 questions live inside each section now
        questions: {
            type: Type.ARRAY,
            items: level1QuestionSchema
        }
    },
    required: ["sectionId", "questions"]
};

// --- ROOT SCHEMA ---
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
        // Replaced top-level 'questions' with 'sections'
        sections: {
            type: Type.ARRAY,
            items: sectionSchema
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
    required: ["paperMetadata", "parsingStatus", "sections", "globalChoices"]
};

export default finalPaperSchema;