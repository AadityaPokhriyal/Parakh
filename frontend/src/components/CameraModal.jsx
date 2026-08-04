import React, { useState, useEffect, useRef } from "react";

export default function CameraModal({ isOpen, onClose, onCaptureTitle = "Add Photos", onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [capturedPhotos, setCapturedPhotos] = useState([]); // Array of { id, file, url }
  const [cameraError, setCameraError] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);

  const handleFallbackFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newCaptured = newFiles.map((file, idx) => ({
        id: `${Date.now()}_${idx}_${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      }));
      setCapturedPhotos((prev) => [...prev, ...newCaptured]);
      e.target.value = "";
    }
  };

  // Enumerate video input devices
  const getCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter((device) => device.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        // Default to environment/back camera if found, else first available
        const backCamera = videoDevices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"));
        setSelectedDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
    }
  };

  // Start video stream
  const startCamera = async () => {
    setCameraError("");
    setIsInitializing(true);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your browser or environment (requires HTTPS or localhost).");
      setIsInitializing(false);
      return;
    }

    try {
      let constraints = { video: { width: { ideal: 1920 }, height: { ideal: 1080 } } };

      if (selectedDeviceId) {
        constraints.video.deviceId = { exact: selectedDeviceId };
      } else {
        constraints.video.facingMode = facingMode;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((playErr) => console.warn("Video play interrupted:", playErr));
      }
      
      // Refresh devices list to get actual camera labels after permission granted
      getCameraDevices();
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No camera device found on your system.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCameraError("Camera is currently in use by another application.");
      } else {
        setCameraError(`Unable to start camera stream: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Stop video stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Initialize camera when modal opens or camera selection changes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      // Clean up captured preview URLs
      capturedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
      setCapturedPhotos([]);
      setCameraError("");
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId, facingMode]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      capturedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, []);

  // Snap photo
  const handleSnapPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `camera_capture_${timestamp}_${capturedPhotos.length + 1}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        const url = URL.createObjectURL(file);

        setCapturedPhotos((prev) => [
          ...prev,
          { id: `${Date.now()}_${Math.random()}`, file, url },
        ]);
      },
      "image/jpeg",
      0.92
    );
  };

  // Remove photo from captured tray
  const handleRemovePhoto = (id) => {
    setCapturedPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Switch facing mode (Front / Back)
  const handleToggleFacingMode = () => {
    setSelectedDeviceId(""); // reset specific device selection to trigger facingMode
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Confirm and attach files to parent
  const handleConfirmCaptured = () => {
    if (capturedPhotos.length === 0) return;
    const filesToReturn = capturedPhotos.map((p) => p.file);
    onCapture(filesToReturn);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleCloseModal}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <h3 style={styles.headerTitle}>Camera Capture</h3>
          </div>
          <button type="button" style={styles.closeBtn} onClick={handleCloseModal} title="Close camera">
            &times;
          </button>
        </div>

        {/* Camera Controls & Device Selector */}
        {devices.length > 1 && !cameraError && (
          <div style={styles.deviceBar}>
            <label style={styles.deviceLabel}>Select Camera:</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              style={styles.deviceSelect}
            >
              {devices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Viewport Area */}
        <div style={styles.viewfinder}>
          {isInitializing && (
            <div style={styles.statusOverlay}>
              <div style={styles.spinner}></div>
              <p style={{ marginTop: "12px" }}>Starting camera stream...</p>
            </div>
          )}

          {cameraError ? (
            <div style={styles.errorOverlay}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={styles.errorText}>{cameraError}</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                <button type="button" onClick={startCamera} style={styles.retryBtn}>
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => fallbackInputRef.current?.click()}
                  style={{
                    ...styles.retryBtn,
                    backgroundColor: "var(--accent-bg, rgba(170, 59, 255, 0.2))",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                  }}
                >
                  📱 Use Native Camera
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={styles.video}
            />
          )}

          {/* Hidden Canvas and Fallback Input for capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFallbackFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Snap Control Row */}
        {!cameraError && (
          <div style={styles.snapRow}>
            {devices.length <= 1 && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                style={styles.secondaryControlBtn}
                title="Flip Camera"
              >
                🔄 Flip
              </button>
            )}

            <button
              type="button"
              onClick={handleSnapPhoto}
              disabled={isInitializing}
              style={{
                ...styles.snapButton,
                opacity: isInitializing ? 0.6 : 1,
                cursor: isInitializing ? "not-allowed" : "pointer",
              }}
              title="Click to take photo"
            >
              <div style={styles.snapButtonInner} />
            </button>

            <span style={styles.photoCountBadge}>
              {capturedPhotos.length} Photo{capturedPhotos.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Session Captured Photos Tray */}
        {capturedPhotos.length > 0 && (
          <div style={styles.traySection}>
            <div style={styles.trayHeader}>
              <span style={styles.trayTitle}>Captured Pages ({capturedPhotos.length})</span>
            </div>
            <div style={styles.trayGrid}>
              {capturedPhotos.map((photo, idx) => (
                <div key={photo.id} style={styles.trayItem}>
                  <img src={photo.url} alt={`Captured ${idx + 1}`} style={styles.trayImg} />
                  <span style={styles.trayIndex}>{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    style={styles.trayDeleteBtn}
                    title="Delete photo"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={handleCloseModal} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCaptured}
            disabled={capturedPhotos.length === 0}
            style={{
              ...styles.confirmBtn,
              backgroundColor: capturedPhotos.length > 0 ? "var(--accent)" : "var(--border)",
              cursor: capturedPhotos.length > 0 ? "pointer" : "not-allowed",
              opacity: capturedPhotos.length > 0 ? 1 : 0.6,
            }}
          >
            ✓ {onCaptureTitle} ({capturedPhotos.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  modal: {
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    backgroundColor: "var(--card-bg, #1c1d24)",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: "var(--text-h)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    color: "var(--text-muted)",
    cursor: "pointer",
    lineHeight: 1,
    padding: "4px 8px",
    borderRadius: "6px",
  },
  deviceBar: {
    padding: "10px 20px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid var(--border)",
  },
  deviceLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  },
  deviceSelect: {
    flex: 1,
    padding: "6px 10px",
    borderRadius: "6px",
    backgroundColor: "var(--bg)",
    color: "var(--text-h)",
    border: "1px solid var(--border)",
    fontSize: "13px",
    outline: "none",
  },
  viewfinder: {
    position: "relative",
    width: "100%",
    height: "320px",
    backgroundColor: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  statusOverlay: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#fff",
    fontSize: "14px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(255, 255, 255, 0.2)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorOverlay: {
    padding: "24px",
    textAlign: "center",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  errorText: {
    fontSize: "14px",
    color: "#fca5a5",
    maxWidth: "360px",
    lineHeight: "1.4",
  },
  retryBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    backgroundColor: "var(--accent)",
    color: "#fff",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  snapRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "16px 20px",
    backgroundColor: "var(--card-bg, #1c1d24)",
    borderBottom: "1px solid var(--border)",
  },
  secondaryControlBtn: {
    position: "absolute",
    left: "20px",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--btn-sec-bg, #1f2028)",
    color: "var(--text-h)",
    fontSize: "13px",
    cursor: "pointer",
  },
  snapButton: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "3px solid var(--accent)",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px",
    transition: "transform 0.15s ease",
  },
  snapButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    transition: "transform 0.15s ease",
  },
  photoCountBadge: {
    position: "absolute",
    right: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--accent)",
  },
  traySection: {
    padding: "12px 20px",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderBottom: "1px solid var(--border)",
    maxHeight: "130px",
    overflowY: "auto",
  },
  trayHeader: {
    marginBottom: "8px",
  },
  trayTitle: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-muted)",
  },
  trayGrid: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  trayItem: {
    position: "relative",
    width: "64px",
    height: "64px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid var(--border)",
    flexShrink: 0,
  },
  trayImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  trayIndex: {
    position: "absolute",
    bottom: "2px",
    left: "2px",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    color: "#fff",
    fontSize: "10px",
    padding: "1px 5px",
    borderRadius: "4px",
    fontWeight: "600",
  },
  trayDeleteBtn: {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    color: "#fff",
    border: "none",
    fontSize: "12px",
    lineHeight: "1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 20px",
  },
  cancelBtn: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-h)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
};
