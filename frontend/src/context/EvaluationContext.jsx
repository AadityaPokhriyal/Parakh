import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from "react";

const EvaluationContext = createContext(null);

export const useEvaluation = () => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error("useEvaluation must be used within an EvaluationProvider");
  }
  return context;
};

let _idCounter = 0;
export const nextId = () => `sheet-${Date.now()}-${++_idCounter}`;

export const createBlankSheet = (overrides = {}) => ({
  id: nextId(),
  studentName: "",
  files: [],
  dragActive: false,
  uploadStatus: "idle", // idle | uploading | success | error
  errorMessage: "",
  responseData: null,
  ...overrides,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BATCH_COOLDOWN_MS = 5000;

export const EvaluationProvider = ({ children }) => {
  const [examPaperId, setExamPaperId] = useState(null);
  const [filename, setFilename] = useState(null);
  const [totalMarks, setTotalMarks] = useState(null);

  const [sheets, setSheets] = useState(() => [createBlankSheet()]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, successCount: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const backendBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Use a ref to keep the latest sheets state accessible inside async loops
  const sheetsRef = useRef(sheets);
  useEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  // Keep track of the active paper ID to prevent duplicate fetches
  const loadedPaperIdRef = useRef(null);

  // Fetch evaluations already stored in DB for this paper
  const fetchEvaluations = useCallback(async (paperId) => {
    if (!paperId || loadedPaperIdRef.current === paperId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${backendBase}/api/evaluations/paper/${paperId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.evaluations) {
          loadedPaperIdRef.current = paperId;
          
          // Re-construct sheet structures from db records
          const loadedSheets = data.evaluations.map((e) => ({
            id: e.id,
            studentName: e.studentName,
            files: [{ name: e.filename, size: 0, type: "application/pdf" }],
            dragActive: false,
            uploadStatus: "success",
            errorMessage: "",
            responseData: {
              success: true,
              evaluationId: e.evaluationId,
              evaluationData: e.evaluationData,
              obtainedMarks: e.obtainedMarks,
              maxMarks: e.maxMarks,
            },
          }));

          // If there are stored sheets, display them. Otherwise, default to one blank sheet.
          if (loadedSheets.length > 0) {
            setSheets(loadedSheets);
          } else {
            setSheets([createBlankSheet()]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load existing evaluations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [backendBase]);

  const setExamInfo = useCallback(({ examPaperId: paperId, filename: fname, totalMarks: marks }) => {
    setExamPaperId((prevId) => {
      if (prevId !== paperId) {
        // If switching to a new exam paper, reset loaded ref and sheets
        loadedPaperIdRef.current = null;
        if (paperId) {
          fetchEvaluations(paperId);
        } else {
          setSheets([createBlankSheet()]);
        }
      }
      return paperId;
    });
    setFilename(fname);
    setTotalMarks(marks);
  }, [fetchEvaluations]);

  const updateSheet = useCallback((id, updates) => {
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const handleAddSheet = useCallback(() => {
    setSheets((prev) => [...prev, createBlankSheet()]);
  }, []);

  const handleDuplicateSheet = useCallback((id) => {
    setSheets((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const source = prev[idx];
      const duplicate = createBlankSheet({ studentName: source.studentName });
      const next = [...prev];
      next.splice(idx + 1, 0, duplicate);
      return next;
    });
  }, []);

  const handleDeleteSheet = useCallback((id) => {
    setSheets((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const handleResetSheet = useCallback((id) => {
    setSheets((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              files: [],
              uploadStatus: "idle",
              errorMessage: "",
              responseData: null,
            }
          : s
      )
    );
  }, []);

  const uploadSingleSheet = useCallback(async (sheet) => {
    const { id, files, studentName } = sheet;
    if (files.length === 0) return false;

    updateSheet(id, { uploadStatus: "uploading", errorMessage: "" });

    const formData = new FormData();
    formData.append("files", files[0]);
    formData.append("question_paper_id", examPaperId);
    if (studentName?.trim()) formData.append("student_name", studentName.trim());

    try {
      const response = await fetch(`${backendBase}/api/evaluations/upload-answers`, {
        method: "POST",
        body: formData,
      });

      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          /* ignore parse error */
        }
      }

      if (response.ok && data && data.success) {
        updateSheet(id, { uploadStatus: "success", responseData: data });
        return true;
      } else {
        const errMsg =
          (data && data.error) ||
          (data && data.message) ||
          `Server responded with status ${response.status}`;
        updateSheet(id, { uploadStatus: "error", errorMessage: errMsg });
        return false;
      }
    } catch (error) {
      updateSheet(id, {
        uploadStatus: "error",
        errorMessage: error.message || "Failed to connect to the backend server.",
      });
      return false;
    }
  }, [backendBase, updateSheet, examPaperId]);

  const handleSubmitAll = useCallback(async () => {
    // Get the latest list of sheets using our ref to avoid closures
    const currentSheets = sheetsRef.current;
    const eligible = currentSheets.filter((s) => s.files.length > 0 && s.uploadStatus !== "success");
    if (eligible.length === 0) return;

    setIsBulkUploading(true);
    setBulkProgress({ current: 0, total: eligible.length, successCount: 0 });

    let successCount = 0;

    for (let i = 0; i < eligible.length; i++) {
      const sheet = eligible[i];
      const ok = await uploadSingleSheet(sheet);
      if (ok) {
        successCount++;
      }
      setBulkProgress({ current: i + 1, total: eligible.length, successCount });

      if (i < eligible.length - 1) {
        await delay(BATCH_COOLDOWN_MS);
      }
    }

    setIsBulkUploading(false);
  }, [uploadSingleSheet]);

  const evaluations = useMemo(() => {
    return sheets
      .filter((s) => s.uploadStatus === "success" && s.responseData)
      .map((s) => ({
        id: s.id,
        studentName:
          s.studentName ||
          s.responseData?.evaluationData?.studentMetadata?.name ||
          "Unknown Student",
        filename: s.files[0]?.name || "answers.pdf",
        evaluationId: s.responseData.evaluationId,
        evaluationData: s.responseData.evaluationData,
        obtainedMarks: s.responseData.obtainedMarks,
        maxMarks: s.responseData.maxMarks,
      }));
  }, [sheets]);

  const value = useMemo(
    () => ({
      examPaperId,
      filename,
      totalMarks,
      sheets,
      isBulkUploading,
      bulkProgress,
      evaluations,
      isLoading,
      setExamInfo,
      setSheets,
      updateSheet,
      handleAddSheet,
      handleDuplicateSheet,
      handleDeleteSheet,
      handleResetSheet,
      uploadSingleSheet,
      handleSubmitAll,
    }),
    [
      examPaperId,
      filename,
      totalMarks,
      sheets,
      isBulkUploading,
      bulkProgress,
      evaluations,
      isLoading,
      setExamInfo,
      updateSheet,
      handleAddSheet,
      handleDuplicateSheet,
      handleDeleteSheet,
      handleResetSheet,
      uploadSingleSheet,
      handleSubmitAll,
    ]
  );

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
};
