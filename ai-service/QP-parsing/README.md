# Question Paper Parsing Service

- This microservice handles the end-to-end extraction and structural parsing of physical/digital question papers into clean, structured JSON format using Google Gemini's multimodal reasoning.
- In this Microservice, Speed is an important factor.

---

## 🚀 System Architecture & Pipeline
Pipeline[Client Request] ──(FormData)──> [Express Router]
                                                │
                                    (Multer Memory Storage Engine)
                                                │
                                ┌───────────────|───────────────────┐
                                ▼ (If PDF)                          ▼ (If Images)
                        [Google Files API]                     [Buffer array]
                    (Uploads to cloud storage)             (Converts to inlineData)
                                │                                   │
                                └───────────────|───────────────────┘
                                                ▼
                                    [Gemini Model (Flash)]
                                    (generateContentStream + Thinking)
                                                │
                                    [Complete Text Chunk Merger]
                                                │
                                                ▼
                                        [JSON Output validation]
                                                │
                                                ▼
                                        [Structured Response]

---

## 🛠️ Key Architectural Features

* **Smart Media Router:** Automatically chooses the optimal processing pipeline. Multi-image arrays are converted directly to standard `inlineData` objects, while single PDFs are uploaded to the cloud via the **Google Files API** to bypass payload size constraints and enable faster document ingestion.
* **Stream-to-JSON Pipeline:** Utilizes the streaming method `generateContentStream` to process responses safely. Stream chunks are buffered on the fly and merged into a single validated JSON output.
* **Resilient Network Handling:** Features a custom **Exponential Backoff Retry Strategy** configured specifically to handle transient Google upstream `503` (Service Unavailable) exceptions safely without crashing the transaction block.

---

## 📡 API Reference

### Parse Question Paper

```http
POST /ai/parse-question-paper
Content-Type: multipart/form-data
```
## Example Response Format (JSON)
```JSON
{
  "paperMetadata": {
    "duration": "3 Hours",
    "examType": "END TERM EXAMINATION",
    "totalMarks": 60
  },
  "sections": [
    {
      "sectionId": "1",
      "questions": []
    }
  ]
}
```
## ⚙️ Environment Variables
Before launching the server, ensure you have the following environment configuration set up in your .env profile:
```env
GEMINI_API_KEY=your_google_gemini_api_key
PORT=3000
```


