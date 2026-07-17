import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function LandingPage() {
  const navigate = useNavigate();

  const features = [
  {
    icon: "📄",
    title: "Upload Question Paper",
    desc: "Upload question papers securely for AI processing.",
  },
  {
    icon: "🤖",
    title: "AI Question Parsing",
    desc: "Automatically extract questions and marks.",
  },
  {
    icon: "✏️",
    title: "Review & Edit",
    desc: "Review and modify extracted questions.",
  },
  {
    icon: "📋",
    title: "Generate Rubric",
    desc: "Create evaluation rubric automatically.",
  },
  {
    icon: "📝",
    title: "Upload Answer Sheets",
    desc: "Upload student answer sheets for evaluation.",
  },
  {
    icon: "📊",
    title: "AI Evaluation Results",
    desc: "Generate evaluation results and insights.",
  },
];


  const contributors = [
  {
    name: "Aaditya Pokhriyal",
    github: "AadityaPokhriyal",
    role: "Team Leader & AI Services Developer & Backend Developer",
  },
  {
    name: "Divyanshu Yadav",
    github: "divyanshuyadav-dev",
    role: "AI Services Developer (Concept Originator) & Data Standardization Lead",
  },
  {
    name: "Gaurav Verma",
    github: "gouravverma23",
    role: "Backend & Integration Developer & Frontend Lead",
  },
  {
    name: "Anshu Kumar",
    github: "anshu-kr576",
    role: "Frontend Developer",
  },
  {
    name: "Jai Singh Rathore",
    github: "jaisingh30-design",
    role: "UI/UX Designer",
  },
  {
    name: "Raj",
    github: "rj-codecraft",
    role: "UI/UX Designer",
  },
];

  return (
    <div style={styles.container}>
      <Navbar />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.badge}>AI-Powered Evaluation Platform</div>

        <h1 style={styles.title}>
          Parakh <span style={styles.gradient}>AI</span>
        </h1>

        <p style={styles.subtitle}>
          Streamline question paper analysis and answer sheet evaluation with
          intelligent AI assistance. Upload, review and evaluate with
          confidence.
        </p>

        <div style={styles.buttonGroup}>
          <button
            style={styles.primaryBtn}
            onClick={() => navigate("/upload")}
          >
            Upload Question Paper →
          </button>

           <button
    style={styles.secondaryBtn}
    onClick={() => {
      document
        .getElementById("workflow")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }}
  >
    Learn More
  </button>
        </div>
      </section>

     {/* Evaluation Workflow */}
 <section
  id="workflow"
   style={styles.workflowSection}>
  <h2 style={styles.sectionTitle}>
    Evaluation Workflow
  </h2>

  <p style={styles.sectionSubtitle}>
    Complete end-to-end AI powered answer sheet
    evaluation process.
  </p>

  <div style={styles.features}>
    {features.map((feature, index) => (
      <div key={index} style={styles.card}>
        <div style={styles.icon}>
          {feature.icon}
        </div>

        <h3 style={styles.cardTitle}>
          {feature.title}
        </h3>

        <p style={styles.cardText}>
          {feature.desc}
        </p>
      </div>
    ))}
  </div>
</section>

      {/* Contributors */}
<section style={styles.contributors}>
  <h2 style={styles.sectionTitle}>
    Contributors
  </h2>

  <div style={styles.contributorsGrid}>
    {contributors.map((person, index) => (
      <div
        key={index}
        style={styles.contributorCard}
      >
       <a
  href={`https://github.com/${person.github}`}
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src={`https://github.com/${person.github}.png`}
    alt={person.name}
    style={styles.avatar}
  />
</a>

        <h3>{person.name}</h3>

        <a
  href={`https://github.com/${person.github}`}
  target="_blank"
  rel="noopener noreferrer"
  style={styles.github}
>
  @{person.github}
</a>

        <p style={styles.role}>
          {person.role}
        </p>
      </div>
    ))}
  </div>
</section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2
  style={{
    marginBottom: "16px",
  }}
>
  Ready to transform answer sheet evaluation?
</h2>

<p
  style={{
    color: "#94a3b8",
    marginBottom: "32px",
    lineHeight: "1.7",
  }}
>
  Start by uploading a question paper and let
  Parakh do the heavy lifting.
</p>

        <button
          style={styles.primaryBtn}
          onClick={() => navigate("/upload")}
        >
          Get Started →
        </button>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0b1120",
    color: "#fff",
    padding: "20px 24px 40px 24px",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto 20px auto",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },

  logo: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    cursor: "pointer",
  },

  loginBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "rgba(30, 41, 59, 0.5)",
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  hero: {
    maxWidth: "900px",
    margin: "0 auto",
    textAlign: "center",
    paddingTop: "60px",
  },

  badge: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: "999px",
    background: "rgba(139,92,246,0.15)",
    color: "#c4b5fd",
    marginBottom: "24px",
    fontWeight: "500",
  },

  title: {
    fontSize: "76px",
    fontWeight: "900",
    margin: "0",
    lineHeight: "1.1",
  },

  gradient: {
    background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    maxWidth: "700px",
    margin: "24px auto",
    fontSize: "22px",
    lineHeight: "1.8",
    color: "#cbd5e1",
  },

  buttonGroup: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "30px",
  },

  primaryBtn: {
    padding: "16px 28px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryBtn: {
    padding: "16px 28px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#e2e8f0",
    fontSize: "16px",
    cursor: "pointer",
  },

 features: {
  maxWidth: "1000px",
  margin: "40px auto 0",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
},

  card: {
  background: "#172033",
  border: "1px solid #28354d",
  borderRadius: "20px",
  padding: "28px",
  textAlign: "center",
  minHeight: "220px",
  width: "100%",
  boxSizing: "border-box",
},

  icon: {
    fontSize: "40px",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "24px",
    marginBottom: "12px",
  },

  cardText: {
    color: "#94a3b8",
    lineHeight: "1.6",
  },

  sectionTitle: {
    fontSize: "42px",
    marginBottom: "40px",
  },

  workflowSection: {
  marginTop: "100px",
  textAlign: "center",
},

sectionSubtitle: {
  color: "#94a3b8",
  maxWidth: "700px",
  margin: "-10px auto 40px",
  lineHeight: "1.7",
},

  cta: {
    textAlign: "center",
    marginTop: "120px",
    padding: "80px 40px",
    borderRadius: "24px",
    background: "#172033",
    border: "1px solid #28354d",
    maxWidth: "1000px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  contributors: {
  marginTop: "100px",
  textAlign: "center",
},

contributorsGrid: {
  maxWidth: "1000px",
  margin: "40px auto 0",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(280px,1fr))",
  gap: "24px",
},

contributorCard: {
  background: "#172033",
  border: "1px solid #28354d",
  borderRadius: "20px",
  padding: "24px",
  textAlign: "center",
},

avatar: {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  objectFit: "cover",
  marginBottom: "16px",
  border: "3px solid #8b5cf6",
},

github: {
  color: "#8b5cf6",
  fontSize: "14px",
  marginBottom: "12px",
  textDecoration: "none",
  display: "inline-block",
},

role: {
  color: "#94a3b8",
  lineHeight: "1.6",
  fontSize: "14px",
},
};

export default LandingPage;