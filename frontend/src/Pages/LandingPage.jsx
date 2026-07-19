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
    <div style={{ background: "var(--bg)", minHeight: "100vh", position: "relative" }}>
      <Navbar />
      <div style={{ ...styles.container, paddingTop: 0 }}>
         <div style={styles.heroGlow}></div>

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
    const element =
      document.getElementById("workflow");

    if (element) {
      window.scrollTo({
        top: element.offsetTop - 130,
        behavior: "smooth",
      });
    }
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
    color: "var(--text-muted)",
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
   </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    padding: "20px 24px 40px 24px",
    transition: "all 0.3s ease",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto 20px auto",
    padding: "10px 0",
    borderBottom: "1px solid var(--border)",
    transition: "all 0.3s ease",
  },

  logo: {
    fontSize: "24px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    cursor: "pointer",
    color: "var(--text-h)",
    transition: "color 0.3s ease",
  },

  loginBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--btn-sec-bg)",
    color: "var(--text)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

hero: {
  maxWidth: "900px",
  margin: "0 auto",
  textAlign: "center",
  minHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  position: "relative",
  zIndex: 1,
},

  badge: {
    display: "inline-block",
    padding: "10px 18px",
    borderRadius: "999px",
    background: "var(--accent-bg)",
    color: "var(--accent)",
    marginBottom: "24px",
    fontWeight: "500",
    border: "1px solid var(--accent-border)",
    transition: "all 0.3s ease",
  },

  title: {
    fontSize: "76px",
    fontWeight: "900",
    margin: "0",
    lineHeight: "1.1",
  },

  gradient: {
    background: "linear-gradient(135deg, var(--accent), #3b82f6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subtitle: {
    maxWidth: "700px",
    margin: "24px auto",
    fontSize: "22px",
    lineHeight: "1.8",
    color: "var(--text-muted)",
    transition: "color 0.3s ease",
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
    background: "linear-gradient(135deg, var(--accent), #6366f1)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  secondaryBtn: {
    padding: "16px 28px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--btn-sec-bg)",
    color: "var(--text)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
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
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    transition: "all 0.3s ease",
    boxShadow: "var(--shadow)",
  },

  icon: {
    fontSize: "40px",
    marginBottom: "16px",
  },

  cardTitle: {
    fontSize: "24px",
    marginBottom: "12px",
    color: "var(--text-h)",
    transition: "color 0.3s ease",
  },

  cardText: {
    color: "var(--text-muted)",
    lineHeight: "1.6",
    transition: "color 0.3s ease",
  },

  sectionTitle: {
    fontSize: "42px",
    marginBottom: "40px",
    color: "var(--text-h)",
    transition: "color 0.3s ease",
  },

  workflowSection: {
  marginTop: "40px",
  textAlign: "center",
},

  stepCard: {
    width: "260px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "18px",
    padding: "28px",
    transition: "all 0.3s ease",
    boxShadow: "var(--shadow)",
  },

  stepNumber: {
    fontSize: "40px",
    fontWeight: "800",
    color: "var(--accent)",
    marginBottom: "10px",
    transition: "color 0.3s ease",
  },

  cta: {
    textAlign: "center",
    marginTop: "120px",
    padding: "80px 40px",
    borderRadius: "24px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    maxWidth: "1000px",
    marginLeft: "auto",
    marginRight: "auto",
    transition: "all 0.3s ease",
    boxShadow: "var(--shadow)",
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
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "center",
    transition: "all 0.3s ease",
    boxShadow: "var(--shadow)",
  },

  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "16px",
    border: "3px solid var(--accent)",
    transition: "border-color 0.3s ease",
  },

  github: {
    color: "var(--accent)",
    fontSize: "14px",
    marginBottom: "12px",
    textDecoration: "none",
    display: "inline-block",
    transition: "color 0.3s ease",
  },

  role: {
    color: "var(--text-muted)",
    lineHeight: "1.6",
    fontSize: "14px",
    transition: "color 0.3s ease",
  },
};

export default LandingPage;