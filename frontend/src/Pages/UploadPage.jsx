import FileUploader from "../components/FileUploader";
import Navbar from "../components/Navbar";
import WorkflowStepper from "../components/WorkflowStepper";

function UploadPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", transition: "background 0.3s ease" }}>
      <Navbar />
      <WorkflowStepper currentStep={1} currentPageName="Upload Question Paper" />
      
      {/* Standardized Left-Aligned Page Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Step 1: Upload Question Paper</h1>
        <p style={styles.pageSubtitle}>
          Upload your exam PDF or images for automated AI parsing and rubric generation.
        </p>
      </div>

      <FileUploader />
    </div>
  );
}

const styles = {
  pageHeader: {
    maxWidth: "1280px",
    width: "100%",
    margin: "10px auto 24px auto",
    padding: "0 40px",
    boxSizing: "border-box",
    textAlign: "center",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "var(--text-h)",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "var(--text-muted)",
    margin: "8px 0 0 0",
    lineHeight: "1.5",
  },
};

export default UploadPage;