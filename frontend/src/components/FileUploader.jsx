import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tempJson from "../tempMockData.json";
import { jsPDF } from "jspdf";

export default function FileUploader() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [responseData, setResponseData] = useState(null);
  const fileInputRef = useRef(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerActiveIndex, setViewerActiveIndex] = useState(0);
  const dragItem = useRef(null);
  const backendUrl = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/exams/upload-paper`;

  // Handle Object URL generation and cleanup
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    const handle = setTimeout(() => {
      setPreviewUrls(urls);
    }, 0);
    return () => {
      clearTimeout(handle);
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Keep the hidden input file list in sync with files state
  useEffect(() => {
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
  }, [files]);

  // Drag and drop sorting handlers for images
  const handleDragStart = (e, index) => {
    dragItem.current = index; //whichever image we are dragging is set dragItem.current so that rerender doesnt occur.
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = dragItem.current; //start index of image we are dragging right now is source index.
    if (sourceIndex === null || sourceIndex === undefined || sourceIndex === targetIndex) return;

    const listCopy = [...files];
    const temp = listCopy[sourceIndex];
    listCopy.splice(sourceIndex, 1); //remove File object at source index whatever we are dragging
    listCopy.splice(targetIndex, 0, temp); //place the dragged object at targetIndex.

    dragItem.current = targetIndex; // when dragged to particular index set current to targetIndex.
    // console.log(listCopy); //used to verify that File Object list ordering is correct or not.
    setFiles(listCopy);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
  };

  const removeFileAtIndex = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      handleReset();
    }
  };

  const openViewer = (index) => {
    setViewerActiveIndex(index);
    setIsViewerOpen(true);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      validateAndSetFile(e.dataTransfer.files);
    }
  };

  // Handle file input selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      validateAndSetFile(e.target.files);
    }
  };

  // Helper function to clear previous error/response data on fresh successful validation
  const resetStatus = () => {
    setUploadStatus("idle");
    setErrorMessage("");
    setResponseData(null);
  };

  // Validates that the files contain a single pdf or a group of images only.
  const validateAndSetFile = (fileList) => {
    const selectedFiles = Array.from(fileList);

    if (selectedFiles.length === 0) return;

    const firstFile = selectedFiles[0];

    if (firstFile.type === "application/pdf" || firstFile.name.endsWith(".pdf")) {
        if (selectedFiles.length > 1) {
          setErrorMessage("Invalid input. Please select only one PDF or multiple images.");
          setUploadStatus("error");
          setFiles([]);
          return;
        }
        setFiles([firstFile]);
        resetStatus();
    }
    else if (firstFile.type.startsWith("image/")) {
      // Check if EVERY single file in the array is an image
      const allAreImages = selectedFiles.every(file => file.type.startsWith("image/"));

      if (!allAreImages) {
        setErrorMessage("Invalid input! All dropped items must be images.");
        setUploadStatus("error");
        setFiles([]);
        return;
      }

      // Valid array of images (works perfectly for 1 image or 100 images)
      setFiles(selectedFiles);
      resetStatus();
    }
    else {
      setErrorMessage("Invalid input! Please select one PDF or a group of images only.");
      setUploadStatus("error");
      setFiles([]);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Trigger input element click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Send the PDF/Images to the backend
  const uploadFile = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    // 1. Create a local variable holding the files we want to send
    let filesToUpload = [...files]; 

    if (files.length > 15) {
      console.log("Converting images to pdf...");
      const doc = new jsPDF();
      const readFileAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      };

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;

          const imgData = await readFileAsDataURL(file);
          if (i > 0) doc.addPage();
          doc.addImage(imgData, file.type.split('/')[1].toUpperCase(), 10, 10, 190, 277,undefined,'FAST');
        }

        const pdfBlob = doc.output("blob");
        const pdfFile = new File([pdfBlob], "memory_doc.pdf", { type: "application/pdf" });
        console.log("Size of generated pdf: ",formatFileSize(pdfFile.size));
        setFiles([pdfFile]); // Updates UI state for later
        resetStatus();

        // 2. Override the local variable with the freshly created PDF file
        filesToUpload = [pdfFile]; 

      } catch (error) {
        console.error("Error generating client-side PDF:", error);
        setErrorMessage("Failed to compile images into a PDF.");
        setUploadStatus("error");
        return; // Stop execution if PDF creation fails
      }
    }

    // 3. The rest of your network code now runs smoothly for BOTH use cases
    setUploadStatus("uploading");
    setErrorMessage("");

    const formData = new FormData();

    // 4. Loop through the local variable, NOT the stale React state
    filesToUpload.forEach((file, index) => {
      formData.append("files", file, `${index}_${file.name}`);
    });

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setUploadStatus("success");
        setResponseData(data);
        navigate("/review", { state: data });
      } else {
        setUploadStatus("error");
        setErrorMessage(data.error || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      setUploadStatus("error");
      setErrorMessage(error.message || "Failed to connect to the backend server.");
    }
  };

  // Reset the state to upload a new file

  const handleReset = () => {
    setFiles([]);
    setUploadStatus("idle");
    setErrorMessage("");
    setResponseData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTestStep2 = () => {
    navigate("/review", { state: tempJson });
  };

  // Compute summary for display card
  const isPdf = files.length === 1 && files[0].type === "application/pdf";
  const totalSize = files.reduce((acc, current) => acc + current.size, 0);
  const displayTitle = isPdf 
    ? files[0].name 
    : `${files.length} Image${files.length > 1 ? "s" : ""} selected`;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Upload Question Paper</h2>
        <p style={styles.subtitle}>Upload your exam PDF or images for automated AI parsing</p>
        <button type="button" onClick={handleTestStep2} style={{...styles.submitButton, backgroundColor: '#10b981', marginBottom: '16px'}}>
          Test Step 2 (Mock Data)
        </button>

        <form onSubmit={uploadFile} style={styles.form}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf,image/*"
            onChange={handleFileChange}
            style={styles.hiddenInput}
            multiple
          />

          {/* Drag & Drop Area */}
          {files.length === 0 && (
            <div
              style={{
                ...styles.dropZone,
                borderColor: dragActive ? "var(--accent)" : "var(--border)",
                backgroundColor: dragActive ? "var(--accent-bg)" : "transparent",
              }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <div style={styles.iconContainer}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v4Z" />
                  <path d="M12 12v4" />
                  <path d="M12 12h2" />
                </svg>
              </div>
              <p style={styles.dropText}>
                Drag & drop your PDF or Images here, or <span style={styles.browseText}>browse</span>
              </p>
              <p style={styles.limitText}>Maximum size: 20 MB</p>
            </div>
          )}

          {/* Selected File(s) Details */}
          {files.length > 0 && (
            <div style={styles.fileDetailsCard}>
              <div style={styles.fileDetailsRow}>
                <div 
                  style={{
                    ...styles.pdfBadge, 
                    backgroundColor: isPdf ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                    borderColor: isPdf ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                    cursor: "pointer"
                  }}
                  onClick={() => openViewer(0)}
                  title="Click to view file"
                >
                  <span style={{...styles.pdfBadgeText, color: isPdf ? "#ef4444" : "#3b82f6"}}>
                    {isPdf ? "PDF" : "IMG"}
                  </span>
                </div>
                <div 
                  style={{ ...styles.fileMeta, cursor: "pointer" }} 
                  onClick={() => openViewer(0)}
                  title="Click to view file"
                >
                  <p style={styles.fileName}>{displayTitle}</p>
                  <p style={styles.fileSize}>{formatFileSize(totalSize)}</p>
                </div>
                {uploadStatus !== "uploading" && (
                  <button
                    type="button"
                    onClick={handleReset}
                    style={styles.removeButton}
                    title="Remove selection"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Grid of image thumbnails if uploading images */}
              {!isPdf && (
                <div style={styles.thumbnailGrid}>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      draggable={uploadStatus !== "uploading"}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => openViewer(index)}
                      style={styles.thumbnailWrapper}
                      title="Drag to reorder, click to view"
                    >
                      <img
                        src={previewUrls[index]}
                        alt={`page-${index + 1}`}
                        draggable={false}
                        style={styles.thumbnailImage}
                      />
                      <div style={styles.thumbnailIndex}>{index + 1}</div>
                      {uploadStatus !== "uploading" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFileAtIndex(index);
                          }}
                          style={styles.thumbnailDelete}
                          title="Remove image"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar for upload */}
              {uploadStatus === "uploading" && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressBarContainer}>
                    <div style={styles.progressBar}></div>
                  </div>
                  <p style={styles.progressText}>Processing with AI, please wait...</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {uploadStatus === "error" && errorMessage && (
            <div style={styles.errorAlert}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8, flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === "success" && (
            <div style={styles.successAlert}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8, flexShrink: 0 }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <strong style={{ display: "block" }}>Parsing Successful!</strong>
                <span style={{ fontSize: "13px" }}>
                  Response logged in browser console. ID: {responseData?.examPaperId}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionRow}>
            {files.length > 0 && uploadStatus !== "success" && (
              <button
                type="submit"
                disabled={uploadStatus === "uploading"}
                style={{
                  ...styles.submitButton,
                  backgroundColor: uploadStatus === "uploading" ? "var(--border)" : "var(--accent)",
                  cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
                }}
              >
                {uploadStatus === "uploading" ? "Parsing..." : "Upload & Parse Paper"}
              </button>
            )}

            {uploadStatus === "success" && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  ...styles.submitButton,
                  backgroundColor: "var(--accent)",
                }}
              >
                Upload Another File
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Fullscreen View List Screen Modal */}
      {isViewerOpen && (
        <div style={styles.viewerOverlay} onClick={() => setIsViewerOpen(false)}>
          <div style={styles.viewerContainer} onClick={(e) => e.stopPropagation()}>
            {/* Header / Close Button */}
            <button
              type="button"
              style={styles.viewerCloseButton}
              onClick={() => setIsViewerOpen(false)}
              title="Close viewer"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Main Content Area */}
            <div style={styles.viewerContent}>
              {files[viewerActiveIndex] && (
                files[viewerActiveIndex].type === "application/pdf" || files[viewerActiveIndex].name.endsWith(".pdf") ? (
                  <iframe
                    src={previewUrls[viewerActiveIndex]}
                    style={styles.viewerPdf}
                    title="PDF Full Preview"
                  />
                ) : (
                  <img
                    src={previewUrls[viewerActiveIndex]}
                    style={styles.viewerImage}
                    alt={`Preview element ${viewerActiveIndex + 1}`}
                  />
                )
              )}
            </div>

            {/* Bottom-Center Index Navigation Buttons */}
            <div style={styles.viewerNavigation}>
              {files.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setViewerActiveIndex(index)}
                  style={{
                    ...styles.viewerNavButton,
                    ...(viewerActiveIndex === index
                      ? styles.viewerNavButtonActive
                      : styles.viewerNavButtonInactive),
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "550px",
    padding: "36px",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    boxShadow: "var(--shadow)",
    textAlign: "left",
    boxSizing: "border-box",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "28px",
    fontWeight: "600",
  },
  subtitle: {
    color: "var(--text)",
    margin: "0 0 24px 0",
    fontSize: "15px",
    lineHeight: "140%",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  hiddenInput: {
    display: "none",
  },
  dropZone: {
    borderWidth: "2px",
    borderStyle: "dashed",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background-color 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  iconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "var(--accent-bg)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  dropText: {
    fontSize: "15px",
    color: "var(--text-h)",
    margin: 0,
  },
  browseText: {
    color: "var(--accent)",
    fontWeight: "600",
    textDecoration: "underline",
  },
  limitText: {
    fontSize: "12px",
    color: "var(--text)",
    margin: 0,
  },
  fileDetailsCard: {
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    backgroundColor: "var(--code-bg)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fileDetailsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  pdfBadge: {
    padding: "6px 10px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: "1px",
    borderStyle: "solid"
  },
  pdfBadgeText: {
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-h)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "var(--text)",
  },
  removeButton: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s, background-color 0.2s",
  },
  progressContainer: {
    width: "100%",
  },
  progressBarContainer: {
    height: "6px",
    width: "100%",
    backgroundColor: "var(--border)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    width: "100%",
    background: "linear-gradient(90deg, var(--border) 0%, var(--accent) 50%, var(--border) 100%)",
    backgroundSize: "200% 100%",
    borderRadius: "3px",
    animation: "shimmer 1.5s infinite linear",
  },
  progressText: {
    margin: "8px 0 0 0",
    fontSize: "12px",
    color: "var(--text)",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorAlert: {
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    color: "#ef4444",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    lineHeight: "140%",
  },
  successAlert: {
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    fontSize: "14px",
    display: "flex",
    alignItems: "flex-start",
    lineHeight: "140%",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  submitButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  thumbnailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(75px, 1fr))",
    gap: "12px",
    marginTop: "12px",
    maxHeight: "260px",
    overflowY: "auto",
    padding: "4px",
    borderTop: "1px solid var(--border)",
    paddingTop: "12px",
  },
  thumbnailWrapper: {
    position: "relative",
    width: "75px",
    height: "75px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid var(--border)",
    cursor: "grab",
    transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailIndex: {
    position: "absolute",
    bottom: "2px",
    left: "2px",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "1px 5px",
    borderRadius: "4px",
    pointerEvents: "none",
  },
  thumbnailDelete: {
    position: "absolute",
    top: "2px",
    right: "2px",
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    color: "#fff",
    border: "none",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    fontSize: "12px",
    lineHeight: "1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s ease",
  },
  viewerOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  viewerContainer: {
    position: "relative",
    width: "90vw",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  viewerCloseButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#fff",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    zIndex: 10001,
  },
  viewerContent: {
    width: "100%",
    height: "calc(100% - 100px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  viewerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: "8px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
  },
  viewerPdf: {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
  },
  viewerNavigation: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: "8px 16px",
    borderRadius: "30px",
    maxWidth: "90%",
    overflowX: "auto",
    zIndex: 10000,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  },
  viewerNavButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  viewerNavButtonActive: {
    backgroundColor: "var(--accent)",
    color: "#fff",
    boxShadow: "0 0 12px var(--accent)",
    border: "2px solid #fff",
    transform: "scale(1.1)",
  },
  viewerNavButtonInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
};

// Add shimmer keyframe animation to document head if we are in client browser environment
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}