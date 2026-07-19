import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./LandingPage.css";

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
  <div className="landing-page">
    <Navbar />

    <div className="landing-container">
      <div className="hero-glow"></div>

      {/* Hero Section */}
      <section className="hero-section">
  <div className="hero-badge">
    AI-Powered Evaluation Platform
  </div>

  <h1 className="hero-title">
    Parakh <span className="gradient-text">AI</span>
  </h1>

  <p className="hero-subtitle">
    Streamline question paper analysis and answer sheet evaluation with
    intelligent AI assistance. Upload, review and evaluate with confidence.
  </p>

  <div className="hero-buttons">
          <button
             className="primary-btn"
            onClick={() => navigate("/upload")}
          >
            Upload Question Paper →
          </button>

     <button
  className="secondary-btn"
  onClick={() => {
const element = document.getElementById("workflow");

if (element) {
  window.scrollTo({
    top: element.offsetTop - 80,
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
 <section id="workflow" className="workflow-section">
  <h2 className="section-title">
    Evaluation Workflow
  </h2>

  <p className="section-subtitle">
    Complete end-to-end AI powered answer sheet evaluation process.
  </p>

  <div className="features-grid">
    {features.map((feature, index) => (
      <div key={index} className="feature-card">
    <div className="feature-icon">
        {feature.icon}
    </div>

    <h3 className="feature-title">
        {feature.title}
    </h3>

    <p className="feature-text">
        {feature.desc}
    </p>
</div>
    ))}
  </div>
</section>

      {/* Contributors */}
<section className="contributors-section">
  <h2 className="section-title">
    Contributors
  </h2>

  <div className="contributors-grid">
    {contributors.map((person, index) => (
      <div
        key={index}
        className="contributor-card"
      >
        <a
          href={`https://github.com/${person.github}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`https://github.com/${person.github}.png`}
            alt={person.name}
            className="contributor-avatar"
          />
        </a>

              <h3>{person.name}</h3>

        <a
          href={`https://github.com/${person.github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          @{person.github}
        </a>

        <p className="contributor-role">
          {person.role}
        </p>
      </div>
    ))}
  </div>
</section>

      {/* CTA */}
<section className="cta-section">
  <h2 className="cta-title">
    Ready to transform answer sheet evaluation?
  </h2>

  <p className="cta-text">
    Start by uploading a question paper and let
    Parakh do the heavy lifting.
  </p>

  <button
    className="primary-btn"
    onClick={() => navigate("/upload")}
  >
    Get Started →
  </button>
</section>
    </div>
   </div>
  );
}

const styles = {};

export default LandingPage;