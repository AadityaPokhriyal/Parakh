import { useState } from "react";
import "./LoginPage.css";
import {
  Mail, Lock, Eye, EyeOff, GraduationCap, Sparkles,
  FileText, ArrowRight, CheckCircle, BarChart3, Zap,
  User, Phone, Building2, ArrowLeft, KeyRound, ShieldCheck,
  RefreshCw,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */

/* ─── Shared keyframe styles ─────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { font-family: 'Inter', system-ui, sans-serif; }

  @keyframes svgFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-18px); }
  }
  @keyframes svgFloatReverse {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(16px); }
  }
  @keyframes svgFloatSlow {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-10px) scale(1.02); }
  }
  @keyframes blobPulse {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50%       { opacity: 0.7;  transform: scale(1.08); }
  }
  @keyframes badgeFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .blob-1 { animation: blobPulse 5s ease-in-out infinite; }
  .blob-2 { animation: blobPulse 6s ease-in-out infinite; animation-delay: -2.5s; }
  .blob-3 { animation: blobPulse 7s ease-in-out infinite; animation-delay: -4s; }
  .badge-float-1 { animation: badgeFloat 6s ease-in-out infinite; }
  .badge-float-2 { animation: badgeFloat 7s ease-in-out infinite; animation-delay: -2s; }
  .badge-float-3 { animation: badgeFloat 5s ease-in-out infinite; animation-delay: -3.5s; }
  .spinner { animation: spin 0.8s linear infinite; }
  .card-enter { animation: fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  .fade-in { animation: fadeIn 0.3s ease both; }
  .pulse-ring::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: rgba(79,70,229,0.35);
    animation: pulse-ring 1.8s ease-out infinite;
  }

  input:focus { outline: none; box-shadow: none; }
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
`;

/* ─── Edu Illustration (shared left panel) ──────────────────────────────── */
function EduIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[500px]">
      <circle cx="240" cy="180" r="130" fill="white" fillOpacity="0.06" />
      <circle cx="240" cy="180" r="95" fill="white" fillOpacity="0.06" />

      {/* Answer sheet LEFT */}
      <g style={{ animation: "svgFloat 7s ease-in-out infinite" }}>
        <rect x="35" y="70" width="145" height="195" rx="10" fill="white" fillOpacity="0.92" />
        <rect x="50" y="88" width="90" height="7" rx="3.5" fill="#4F46E5" fillOpacity="0.6" />
        <rect x="50" y="105" width="115" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <rect x="50" y="117" width="100" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <circle cx="60" cy="140" r="8" fill="#22C55E" fillOpacity="0.85" />
        <polyline points="56,140 59,143 65,137" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="136" width="60" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <circle cx="60" cy="163" r="8" fill="#22C55E" fillOpacity="0.85" />
        <polyline points="56,163 59,166 65,160" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="76" y="159" width="74" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <circle cx="60" cy="186" r="8" fill="#F59E0B" fillOpacity="0.85" />
        <text x="60" y="190" fontSize="9" fill="white" textAnchor="middle" fontWeight="700">~</text>
        <rect x="76" y="182" width="55" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <circle cx="60" cy="209" r="8" fill="#EF4444" fillOpacity="0.8" />
        <line x1="57" y1="206" x2="63" y2="212" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="63" y1="206" x2="57" y2="212" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <rect x="76" y="205" width="65" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <rect x="50" y="232" width="64" height="22" rx="11" fill="#4F46E5" />
        <text x="82" y="246" fontSize="10" fill="white" textAnchor="middle" fontWeight="700">83 / 100</text>
      </g>

      {/* AI Brain CENTER */}
      <g style={{ animation: "svgFloatSlow 8s ease-in-out infinite", transformOrigin: "240px 180px" }}>
        <circle cx="240" cy="180" r="56" fill="white" fillOpacity="0.14" stroke="white" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="6 4" />
        <circle cx="240" cy="180" r="46" fill="white" fillOpacity="0.93" />
        <circle cx="224" cy="168" r="5.5" fill="#4F46E5" />
        <circle cx="256" cy="168" r="5.5" fill="#4F46E5" />
        <circle cx="224" cy="192" r="5.5" fill="#3B82F6" />
        <circle cx="256" cy="192" r="5.5" fill="#3B82F6" />
        <circle cx="240" cy="175" r="7" fill="#6366F1" />
        <circle cx="240" cy="185" r="7" fill="#818CF8" />
        <line x1="224" y1="168" x2="240" y2="175" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="256" y1="168" x2="240" y2="175" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="224" y1="192" x2="240" y2="185" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="256" y1="192" x2="240" y2="185" stroke="#3B82F6" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="240" y1="175" x2="240" y2="185" stroke="#6366F1" strokeWidth="1.5" strokeOpacity="0.5" />
        <path d="M228 156 L229.5 160.5 L234 162 L229.5 163.5 L228 168 L226.5 163.5 L222 162 L226.5 160.5Z" fill="#F59E0B" />
        <text x="240" y="208" fontSize="8" fill="#4F46E5" textAnchor="middle" fontWeight="800" letterSpacing="3">AI</text>
      </g>

      <line x1="182" y1="175" x2="194" y2="175" stroke="white" strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.35" />
      <line x1="286" y1="175" x2="305" y2="168" stroke="white" strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.35" />

      {/* Answer sheet RIGHT */}
      <g style={{ animation: "svgFloatReverse 9s ease-in-out infinite", animationDelay: "-3s" }}>
        <rect x="300" y="60" width="140" height="185" rx="10" fill="white" fillOpacity="0.92" />
        <rect x="316" y="78" width="80" height="7" rx="3.5" fill="#3B82F6" fillOpacity="0.6" />
        <rect x="316" y="94" width="108" height="4" rx="2" fill="#94A3B8" fillOpacity="0.45" />
        <rect x="316" y="112" width="13" height="36" rx="3" fill="#4F46E5" fillOpacity="0.7" />
        <rect x="335" y="124" width="13" height="24" rx="3" fill="#3B82F6" fillOpacity="0.7" />
        <rect x="354" y="118" width="13" height="30" rx="3" fill="#22C55E" fillOpacity="0.7" />
        <rect x="373" y="108" width="13" height="40" rx="3" fill="#6366F1" fillOpacity="0.7" />
        <line x1="316" y1="150" x2="390" y2="150" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="316" y="162" width="46" height="22" rx="11" fill="#22C55E" />
        <text x="339" y="176" fontSize="10" fill="white" textAnchor="middle" fontWeight="700">A+</text>
        <rect x="370" y="162" width="56" height="22" rx="11" fill="#EEF2FF" />
        <text x="398" y="176" fontSize="10" fill="#4F46E5" textAnchor="middle" fontWeight="600">94%</text>
        <rect x="316" y="196" width="112" height="4" rx="2" fill="#94A3B8" fillOpacity="0.35" />
        <rect x="316" y="208" width="90" height="4" rx="2" fill="#94A3B8" fillOpacity="0.35" />
        <rect x="316" y="220" width="100" height="4" rx="2" fill="#94A3B8" fillOpacity="0.35" />
      </g>

      {/* Graduation cap */}
      <g style={{ animation: "svgFloat 6s ease-in-out infinite", animationDelay: "-2s" }} transform="translate(360, 18)">
        <polygon points="28,6 56,20 28,34 0,20" fill="white" fillOpacity="0.85" />
        <rect x="2" y="22" width="52" height="9" rx="4.5" fill="white" fillOpacity="0.65" />
        <line x1="52" y1="23" x2="58" y2="46" stroke="white" strokeWidth="2.5" strokeOpacity="0.65" strokeLinecap="round" />
        <circle cx="58" cy="49" r="5" fill="#F59E0B" fillOpacity="0.9" />
      </g>

      {/* Book stack */}
      <g style={{ animation: "svgFloatReverse 7s ease-in-out infinite", animationDelay: "-4s" }} transform="translate(40, 298)">
        <rect x="0" y="24" width="108" height="16" rx="5" fill="#6366F1" fillOpacity="0.75" />
        <rect x="5" y="10" width="98" height="16" rx="5" fill="#818CF8" fillOpacity="0.75" />
        <rect x="10" y="0" width="88" height="13" rx="5" fill="#A5B4FC" fillOpacity="0.75" />
      </g>

      <circle cx="168" cy="42" r="6" fill="white" fillOpacity="0.45" style={{ animation: "svgFloat 5s ease-in-out infinite", animationDelay: "-1s" }} />
      <circle cx="430" cy="290" r="9" fill="white" fillOpacity="0.35" style={{ animation: "svgFloatReverse 6s ease-in-out infinite", animationDelay: "-3s" }} />
      <circle cx="72" cy="316" r="5" fill="white" fillOpacity="0.4" style={{ animation: "svgFloat 8s ease-in-out infinite", animationDelay: "-5s" }} />
      <circle cx="418" cy="52" r="7" fill="white" fillOpacity="0.35" style={{ animation: "svgFloatReverse 9s ease-in-out infinite", animationDelay: "-2s" }} />
      <circle cx="228" cy="292" r="4.5" fill="white" fillOpacity="0.8" />
      <circle cx="246" cy="292" r="4.5" fill="white" fillOpacity="0.5" />
      <circle cx="264" cy="292" r="4.5" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

/* ─── Left Panel ─────────────────────────────────────────────────────────── */
function LeftPanel({ view }) {
  const headlines = {
    login:  { title: "AI-Powered Answer Sheet\nEvaluation", sub: "Evaluate answer sheets faster, smarter, and more accurately using Artificial Intelligence." },
    signup: { title: "Join Thousands of\nEducators Worldwide", sub: "Set up your institution in minutes and start evaluating with AI-powered precision today." },
    forgot: { title: "Secure Account\nRecovery", sub: "We keep your account safe. Password reset links expire in 15 minutes and are single-use." },
  };
  const { title, sub } = headlines[view];

  return (
    <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 40%, #3B82F6 100%)" }}>

      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />

      <div className="blob-1 absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.1)" }} />
      <div className="blob-2 absolute top-1/2 -right-36 w-[320px] h-[320px] rounded-full blur-3xl" style={{ background: "rgba(147,197,253,0.15)" }} />
      <div className="blob-3 absolute bottom-0 left-1/4 w-[280px] h-[280px] rounded-full blur-3xl" style={{ background: "rgba(199,210,254,0.12)" }} />

      <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-white/90 font-semibold text-base tracking-tight">EvalAI</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[520px] mx-auto">
            <EduIllustration />

            <div className="badge-float-1 absolute -left-6 top-10 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-indigo-900/25 flex items-center gap-3 border border-white/80">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={17} className="text-green-600" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 leading-none mb-1">Evaluated Today</div>
                <div className="text-sm font-bold text-slate-800 leading-none">1,247 Sheets</div>
              </div>
            </div>

            <div className="badge-float-2 absolute -right-6 top-6 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-indigo-900/25 flex items-center gap-3 border border-white/80">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap size={17} className="text-indigo-600" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 leading-none mb-1">Accuracy Rate</div>
                <div className="text-sm font-bold text-slate-800 leading-none">98.4%</div>
              </div>
            </div>

            <div className="badge-float-3 absolute -right-4 bottom-4 bg-white rounded-2xl px-4 py-3 shadow-2xl shadow-indigo-900/25 flex items-center gap-3 border border-white/80">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BarChart3 size={17} className="text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 leading-none mb-1">Time Saved / Day</div>
                <div className="text-sm font-bold text-slate-800 leading-none">4.2 hours</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 max-w-lg px-4 fade-in" key={view}>
            <h1 className="text-3xl xl:text-[2.3rem] font-bold text-white leading-[1.2] tracking-tight">
              {title.split("\n").map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}
            </h1>
            <p className="mt-3 text-indigo-200/90 text-[15px] leading-relaxed">{sub}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-7 w-full max-w-lg px-4">
            {[
              { icon: <Zap size={15} />, text: "Instant AI Evaluation" },
              { icon: <FileText size={15} />, text: "Question-wise Feedback" },
              { icon: <GraduationCap size={15} />, text: "Trusted by Institutions" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/10 border border-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex-1">
                <div className="text-indigo-200 flex-shrink-0">{f.icon}</div>
                <span className="text-white/90 text-[13px] font-medium leading-snug">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          {["500+ Schools", "50K+ Students", "ISO Certified"].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 text-white/60 text-xs">
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared input field ─────────────────────────────────────────────────── */
function InputField({ label, placeholder, type = "text", icon, value, onChange, rightEl, focused, onFocus, onBlur }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">{label}</label>
      <div
        className="flex items-center gap-3 border rounded-xl px-4 py-3 transition-all duration-200"
        style={{
          borderColor: focused ? "#6366F1" : "#E2E8F0",
          backgroundColor: focused ? "#ffffff" : "#F8FAFC",
          boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        }}
      >
        <span style={{ color: focused ? "#6366F1" : "#94A3B8", flexShrink: 0, transition: "color 0.2s", display: "flex" }}>{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="flex-1 bg-transparent text-slate-800 text-[14px] placeholder:text-slate-400"
        />
        {rightEl}
      </div>
    </div>
  );
}

/* ─── Password strength bar ─────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  const score = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= score ? colors[score] : "#E2E8F0" }} />
        ))}
      </div>
      <p className="text-[11px] font-medium" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
}

/* ─── Shared card wrapper ────────────────────────────────────────────────── */
function CardShell({ children }) {
  return (
    <div
      className="bg-white rounded-[16px] border border-slate-200/80 px-8 pt-8 pb-7 card-enter"
      style={{ boxShadow: "0 8px 48px rgba(79,70,229,0.11), 0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {children}
    </div>
  );
}

/* ─── App Logo mark ─────────────────────────────────────────────────────── */
function AppLogo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative mb-3">
        <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)", boxShadow: "0 8px 24px rgba(79,70,229,0.28)" }}>
          <GraduationCap size={24} className="text-white" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-[20px] h-[20px] bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <Sparkles size={10} className="text-white" />
        </div>
      </div>
      <p className="text-[14px] font-bold text-slate-700 tracking-tight">EvalAI</p>
    </div>
  );
}

/* ─── Primary CTA button ────────────────────────────────────────────────── */
function PrimaryButton({ onClick, loading, label, loadingLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed text-[15px]"
      style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)", boxShadow: "0 4px 20px rgba(79,70,229,0.28)" }}
      onMouseEnter={e => { if (!loading) (e.currentTarget).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget).style.transform = "translateY(0)"; }}
    >
      {loading ? (
        <>
          <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}

/* ─── Footer links ──────────────────────────────────────────────────────── */
function FooterLinks() {
  return (
    <div className="flex items-center justify-center gap-1 mt-5">
      {["Privacy Policy", "Terms of Service", "Help Center"].map((link, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300 text-xs">·</span>}
          <button className="text-[12px] text-slate-400 hover:text-slate-600 transition-colors px-1">{link}</button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGIN VIEW
═══════════════════════════════════════════════════════════════════════════ */
function LoginCard({ onNavigate }) {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ef, setEf] = useState(false);
  const [pf, setPf] = useState(false);

  const handle = () => { setLoading(true); setTimeout(() => setLoading(false), 2200); };

  return (
    <CardShell>
      <AppLogo />

      <div className="text-center mb-6">
        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-slate-500 text-sm mt-1.5">Sign in to continue evaluating answer sheets.</p>
      </div>

      {/* Google */}
      <button className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 text-[14px] font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 mb-5">
        <GoogleIcon />
        Continue with Google
      </button>

      <Divider />

      <div className="space-y-4 mt-5">
        <InputField label="Email Address" placeholder="you@university.edu" type="email"
          icon={<Mail size={16} />} value={email} onChange={setEmail}
          focused={ef} onFocus={() => setEf(true)} onBlur={() => setEf(false)} />

        <InputField label="Password" placeholder="Enter your password" type={showPw ? "text" : "password"}
          icon={<Lock size={16} />} value={pw} onChange={setPw}
          focused={pf} onFocus={() => setPf(true)} onBlur={() => setPf(false)}
          rightEl={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          } />
      </div>

      <div className="flex items-center justify-between mt-4 mb-5">
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRemember(!remember)}>
          <Checkbox checked={remember} />
          <span className="text-[13px] text-slate-600 select-none">Remember me</span>
        </label>
        <button onClick={() => onNavigate("forgot")} className="text-[13px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors hover:underline underline-offset-2">
          Forgot Password?
        </button>
      </div>

      <PrimaryButton onClick={handle} loading={loading} label="Sign In" loadingLabel="Signing In..." />

      <p className="text-center text-[13px] text-slate-500 mt-5">
        Don&apos;t have an account?{" "}
        <button onClick={() => onNavigate("signup")} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors hover:underline underline-offset-2">
          Create Account
        </button>
      </p>
    </CardShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CREATE ACCOUNT VIEW
═══════════════════════════════════════════════════════════════════════════ */
function SignupCard({ onNavigate }) {
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // focus states
  const [nf, setNf] = useState(false);
  const [ef, setEf] = useState(false);
  const [phf, setPhf] = useState(false);
  const [inf, setInf] = useState(false);
  const [pf, setPf] = useState(false);
  const [cpf, setCpf] = useState(false);

  const pwMatch = cpw === "" || pw === cpw;

  const handleNext = () => {
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setTimeout(() => setLoading(false), 2200);
  };

  return (
    <CardShell>
      {/* Back */}
      <button onClick={() => step === 2 ? setStep(1) : onNavigate("login")}
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-[13px] font-medium transition-colors mb-5 group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        {step === 2 ? "Back to Step 1" : "Back to Sign In"}
      </button>

      <AppLogo />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0"
                style={{
                  background: s < step ? "#22C55E" : s === step ? "linear-gradient(135deg,#4F46E5,#3B82F6)" : "#F1F5F9",
                  color: s <= step ? "white" : "#94A3B8",
                }}>
                {s < step ? <CheckCircle size={14} /> : s}
              </div>
              <span className="text-[12px] font-medium" style={{ color: s === step ? "#4F46E5" : s < step ? "#22C55E" : "#94A3B8" }}>
                {s === 1 ? "Basic Info" : "Set Password"}
              </span>
            </div>
            {s < 2 && <div className="flex-1 h-px mx-1" style={{ background: step > 1 ? "#22C55E" : "#E2E8F0" }} />}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <>
          <div className="text-center mb-5">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Create Your Account</h1>
            <p className="text-slate-500 text-sm mt-1">Fill in your details to get started.</p>
          </div>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 text-[14px] font-medium hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 mb-4">
            <GoogleIcon />
            Sign up with Google
          </button>
          <Divider />

          <div className="space-y-3.5 mt-4">
            <InputField label="Full Name" placeholder="Dr. Ananya Sharma"
              icon={<User size={16} />} value={name} onChange={setName}
              focused={nf} onFocus={() => setNf(true)} onBlur={() => setNf(false)} />

            <InputField label="Email Address" placeholder="you@university.edu" type="email"
              icon={<Mail size={16} />} value={email} onChange={setEmail}
              focused={ef} onFocus={() => setEf(true)} onBlur={() => setEf(false)} />

            <InputField label="Phone Number" placeholder="+91 98765 43210" type="tel"
              icon={<Phone size={16} />} value={phone} onChange={setPhone}
              focused={phf} onFocus={() => setPhf(true)} onBlur={() => setPhf(false)} />

            <InputField label="Institution Name" placeholder="Delhi University, IIT Bombay…"
              icon={<Building2 size={16} />} value={institution} onChange={setInstitution}
              focused={inf} onFocus={() => setInf(true)} onBlur={() => setInf(false)} />

            {/* Role select */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {["Teacher", "HOD", "Admin"].map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className="py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-200"
                    style={{
                      borderColor: role === r ? "#4F46E5" : "#E2E8F0",
                      background: role === r ? "#EEF2FF" : "#F8FAFC",
                      color: role === r ? "#4F46E5" : "#64748B",
                    }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-5">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Secure Your Account</h1>
            <p className="text-slate-500 text-sm mt-1">Choose a strong password to protect your data.</p>
          </div>

          <div className="space-y-4">
            <div>
              <InputField label="Create Password" placeholder="Min. 8 chars, 1 uppercase, 1 number"
                type={showPw ? "text" : "password"}
                icon={<Lock size={16} />} value={pw} onChange={setPw}
                focused={pf} onFocus={() => setPf(true)} onBlur={() => setPf(false)}
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              <PasswordStrength password={pw} />
            </div>

            <div>
              <InputField label="Confirm Password" placeholder="Repeat your password"
                type={showCpw ? "text" : "password"}
                icon={<Lock size={16} />} value={cpw} onChange={setCpw}
                focused={cpf} onFocus={() => setCpf(true)} onBlur={() => setCpf(false)}
                rightEl={
                  <button type="button" onClick={() => setShowCpw(!showCpw)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
                    {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                } />
              {!pwMatch && cpw && (
                <p className="text-[11px] text-red-500 font-medium mt-1.5">Passwords do not match.</p>
              )}
            </div>

            {/* Password checklist */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Password Requirements</p>
              {[
                { rule: "At least 8 characters", ok: pw.length >= 8 },
                { rule: "One uppercase letter (A–Z)", ok: /[A-Z]/.test(pw) },
                { rule: "One number (0–9)", ok: /[0-9]/.test(pw) },
                { rule: "One special character (!@#…)", ok: /[^A-Za-z0-9]/.test(pw) },
              ].map(({ rule, ok }) => (
                <div key={rule} className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{ background: ok ? "#DCFCE7" : "#F1F5F9" }}>
                    {ok ? <CheckCircle size={11} className="text-green-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                  </div>
                  <span className="text-[12px] transition-colors duration-200" style={{ color: ok ? "#16A34A" : "#94A3B8" }}>{rule}</span>
                </div>
              ))}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer" onClick={() => setAgree(!agree)}>
              <div className="mt-0.5 flex-shrink-0">
                <Checkbox checked={agree} />
              </div>
              <span className="text-[12.5px] text-slate-600 leading-snug select-none">
                I agree to the{" "}
                <span className="text-indigo-600 font-semibold hover:underline underline-offset-2">Terms of Service</span>
                {" "}and{" "}
                <span className="text-indigo-600 font-semibold hover:underline underline-offset-2">Privacy Policy</span>
              </span>
            </label>
          </div>
        </>
      )}

      <div className="mt-5">
        <PrimaryButton
          onClick={handleNext}
          loading={loading}
          label={step === 1 ? "Continue" : "Create Account"}
          loadingLabel="Creating Account..." />
      </div>

      <p className="text-center text-[13px] text-slate-500 mt-4">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors hover:underline underline-offset-2">
          Sign In
        </button>
      </p>
    </CardShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORGOT PASSWORD VIEW  (3 sub-steps: enter email → check inbox → success)
═══════════════════════════════════════════════════════════════════════════ */
function ForgotCard({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [ef, setEf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [substep, setSubstep] = useState<"email" | "sent" | "done">("email");
  const [countdown, setCountdown] = useState(30);

  const handleSend = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubstep("sent"); startCountdown(); }, 2000);
  };

  const startCountdown = () => {
    let c = 30;
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) clearInterval(iv);
    }, 1000);
  };

  const handleResend = () => {
    setCountdown(30);
    startCountdown();
  };

  if (substep === "sent") {
    return (
      <CardShell>
        <button onClick={() => setSubstep("email")}
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-[13px] font-medium transition-colors mb-5 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Change email
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          {/* Animated mail icon */}
          <div className="relative mb-4">
            <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center pulse-ring relative"
              style={{ background: "linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)", boxShadow: "0 8px 28px rgba(79,70,229,0.30)" }}>
              <Mail size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Check Your Inbox</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-[300px]">
            We&apos;ve sent a password reset link to<br />
            <span className="font-semibold text-slate-700">{email || "your email"}</span>
          </p>
        </div>

        {/* Steps */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 mb-5">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-3">What to do next</p>
          {[
            { icon: <Mail size={14} />, text: "Open the email from EvalAI" },
            { icon: <KeyRound size={14} />, text: "Click the secure reset link inside" },
            { icon: <Lock size={14} />, text: "Create a strong new password" },
          ].map(({ icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-500">{icon}</div>
              <span className="text-[13px] text-slate-600">{text}</span>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
          <ShieldCheck size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700 leading-snug">
            The link expires in <span className="font-bold">15 minutes</span> and can only be used once.
          </p>
        </div>

        {/* Resend */}
        <button
          onClick={countdown <= 0 ? handleResend : undefined}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-[14px] font-medium transition-all duration-200"
          style={{ color: countdown <= 0 ? "#4F46E5" : "#94A3B8", cursor: countdown <= 0 ? "pointer" : "not-allowed", backgroundColor: countdown <= 0 ? "#F8FAFC" : "#FAFAFA" }}>
          <RefreshCw size={14} className={countdown <= 0 ? "" : "opacity-40"} />
          {countdown <= 0 ? "Resend Email" : `Resend in ${countdown}s`}
        </button>

        <button onClick={() => onNavigate("login")}
          className="w-full mt-3 py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-200"
          style={{ background: "linear-gradient(135deg,#4F46E5,#3B82F6)", boxShadow: "0 4px 20px rgba(79,70,229,0.25)" }}
          onMouseEnter={e => { (e.currentTarget).style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { (e.currentTarget).style.transform = "translateY(0)"; }}>
          Back to Sign In
        </button>
      </CardShell>
    );
  }

  // Default: email entry
  return (
    <CardShell>
      <button onClick={() => onNavigate("login")}
        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-[13px] font-medium transition-colors mb-5 group">
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Sign In
      </button>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg,#4F46E5,#3B82F6)", boxShadow: "0 8px 24px rgba(79,70,229,0.28)" }}>
          <KeyRound size={24} className="text-white" />
        </div>
        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">Forgot Password?</h1>
        <p className="text-slate-500 text-sm mt-1.5 leading-snug max-w-[300px]">
          No worries! Enter your registered email and we&apos;ll send a secure reset link.
        </p>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5">
        <ShieldCheck size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-indigo-700 leading-snug">
          For security, the reset link expires in <span className="font-bold">15 minutes</span>.
        </p>
      </div>

      <InputField label="Registered Email Address" placeholder="you@university.edu" type="email"
        icon={<Mail size={16} />} value={email} onChange={setEmail}
        focused={ef} onFocus={() => setEf(true)} onBlur={() => setEf(false)} />

      <div className="mt-5">
        <PrimaryButton onClick={handleSend} loading={loading} label="Send Reset Link" loadingLabel="Sending Link..." />
      </div>

      {/* Alternate options */}
      <div className="mt-5 border-t border-slate-100 pt-5">
        <p className="text-[12px] text-slate-400 text-center mb-3 font-medium">Other recovery options</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5 text-[12px] text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
            <Phone size={13} className="text-slate-400" />
            Via Phone
          </button>
          <button className="flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2.5 text-[12px] text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
            <Building2 size={13} className="text-slate-400" />
            Contact Admin
          </button>
        </div>
      </div>

      <p className="text-center text-[13px] text-slate-500 mt-4">
        Remembered it?{" "}
        <button onClick={() => onNavigate("login")} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors hover:underline underline-offset-2">
          Sign In
        </button>
      </p>
    </CardShell>
  );
}

/* ─── Tiny helpers ───────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.717v2.258h2.908C16.658 14.252 17.64 11.944 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-slate-400 text-xs font-medium px-1">OR</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function Checkbox({ checked }) {
  return (
    <div className="w-[16px] h-[16px] rounded border flex items-center justify-center transition-all duration-200 flex-shrink-0"
      style={{ backgroundColor: checked ? "#4F46E5" : "#ffffff", borderColor: checked ? "#4F46E5" : "#CBD5E1" }}>
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

/* ─── Right panel wrapper ────────────────────────────────────────────────── */
function RightPanel({ children }) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-25 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        {children}
        <FooterLinks />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [view, setView] = useState("login");

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div className="min-h-screen flex overflow-hidden bg-[#F8FAFC]">

        {/* Left panel — always visible on desktop */}
        <LeftPanel view={view} />

        {/* Right panel — swaps cards */}
        <RightPanel>
          {view === "login"  && <LoginCard  onNavigate={setView} />}
          {view === "signup" && <SignupCard onNavigate={setView} />}
          {view === "forgot" && <ForgotCard onNavigate={setView} />}
        </RightPanel>

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3.5"
          style={{ background: "linear-gradient(135deg,#4338CA,#3B82F6)", boxShadow: "0 2px 16px rgba(79,70,229,0.25)" }}>
          <div className="flex items-center gap-2">
            <GraduationCap size={17} className="text-white" />
            <span className="text-white text-sm font-semibold">EvalAI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">98.4% Accuracy</span>
          </div>
        </div>
      </div>
    </>
  );
}
