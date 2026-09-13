import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Particle System ─────────────────────────────────────────────────────────
function useParticles(count = 28) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 8,
      duration: 7 + Math.random() * 8,
      opacity: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 60,
    }))
  );
  return particles;
}

// ── Mandala SVG ─────────────────────────────────────────────────────────────
function MandalaHero({ spin = false, size = 320, glow = false }) {
  const rings = [130, 105, 80, 55, 28, 10];
  const petalLayers = [
    { r: 115, count: 16, rx: 14, ry: 5 },
    { r: 88, count: 12, rx: 11, ry: 4 },
    { r: 62, count: 8, rx: 9, ry: 3.5 },
    { r: 38, count: 6, rx: 7, ry: 3 },
  ];
  return (
    <svg
      width={size} height={size}
      viewBox="-160 -160 320 320"
      style={{
        animation: spin ? "mandalaSpin 60s linear infinite" : "none",
        filter: glow ? "drop-shadow(0 0 32px rgba(212,175,55,0.35))" : "none",
        opacity: 0.9,
      }}
    >
      {rings.map(r => (
        <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="#D4AF37"
          strokeWidth={r > 100 ? 0.5 : r > 60 ? 0.7 : 0.9} opacity={0.6} />
      ))}
      {petalLayers.map((layer, li) =>
        Array.from({ length: layer.count }, (_, i) => {
          const angle = (i * 360) / layer.count;
          return (
            <ellipse key={`${li}-${i}`}
              cx={0} cy={-layer.r}
              rx={layer.rx} ry={layer.ry}
              fill="#D4AF37" opacity={0.55}
              transform={`rotate(${angle})`}
            />
          );
        })
      )}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        return (
          <line key={i} x1="0" y1="0"
            x2={130 * Math.cos(a - Math.PI / 2)}
            y2={130 * Math.sin(a - Math.PI / 2)}
            stroke="#D4AF37" strokeWidth="0.4" opacity="0.35" />
        );
      })}
      <circle cx="0" cy="0" r="8" fill="#D4AF37" opacity="0.9" />
      <circle cx="0" cy="0" r="4" fill="#FBF5E6" opacity="0.95" />
    </svg>
  );
}

// ── Sign-In Modal ────────────────────────────────────────────────────────────
function SignInModal({ role, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setShow(true)); }, []);

  const cfg = {
    admin: {
      icon: "🏛",
      title: "Admin Portal",
      sub: "Full club management & financial dashboard",
      color: "#C97B2A",
      dest: "Launching Admin Dashboard…",
    },
    collector: {
      icon: "🪔",
      title: "Collector Portal",
      sub: "Sign in to start recording donations",
      color: "#1E5C3A",
      dest: "Preparing Collector App…",
    },
    auditor: {
      icon: "🛡",
      title: "Auditor Portal",
      sub: "Read-only access to financial audit trail",
      color: "#4A2C1A",
      dest: "Opening Audit Dashboard…",
    },
  }[role];

  const handleSubmit = () => {
    if (!email || !pass) { setErr("Please fill in all fields"); return; }
    setErr(""); setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess(role); }, 1600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(10,4,2,0.88)",
      backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      opacity: show ? 1 : 0,
      transition: "opacity 0.35s ease",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#FFFBF3",
        borderRadius: 24,
        padding: 40,
        width: "100%",
        maxWidth: 440,
        boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,123,42,0.15)`,
        transform: show ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: cfg.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: `1.5px solid ${cfg.color}28` }}>{cfg.icon}</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: "#2C1A0E" }}>{cfg.title}</div>
              <div style={{ fontSize: 12, color: "#7A5A3A", marginTop: 2 }}>{cfg.sub}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#7A5A3A", padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {err && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#C0392B", marginBottom: 16 }}>⚠ {err}</div>}

        <label style={LS}>Email Address</label>
        <div style={IW}>
          <span style={{ fontSize: 15, opacity: 0.5 }}>✉</span>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" style={IS}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        <label style={LS}>Password</label>
        <div style={IW}>
          <span style={{ fontSize: 15, opacity: 0.5 }}>🔒</span>
          <input value={pass} onChange={e => setPass(e.target.value)}
            type="password" placeholder="••••••••" style={IS}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", height: 52, borderRadius: 13, marginTop: 8,
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`,
          border: "none", color: "white",
          fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.8 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: `0 6px 24px ${cfg.color}45`,
          transition: "transform 0.15s, opacity 0.15s",
        }}>
          {loading
            ? <><Spinner /> {cfg.dest}</>
            : `→ Enter ${cfg.title}`}
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: "#7A5A3A", marginTop: 16 }}>
          🛡 Encrypted · GPS-verified · Audit-logged
        </div>
      </div>
    </div>
  );
}

const LS = { display: "block", fontSize: 10, fontWeight: 600, color: "#7A5A3A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, fontFamily: "'Sora',sans-serif" };
const IW = { display: "flex", alignItems: "center", gap: 10, background: "#FDF8EE", border: "1.5px solid rgba(201,123,42,0.15)", borderRadius: 12, padding: "0 16px", height: 50 };
const IS = { flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#2C1A0E", fontFamily: "'Sora',sans-serif" };

function Spinner() {
  return <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spinAnim 0.7s linear infinite" }} />;
}

// ── Destination Screen ───────────────────────────────────────────────────────
function DestinationScreen({ role, onBack }) {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  if (role === "collector") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: `linear-gradient(160deg, #1A0A04 0%, #0D0500 100%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 32,
        opacity: show ? 1 : 0, transition: "opacity 0.6s ease",
      }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 20, color: "rgba(212,175,55,0.5)", marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Welcome, Collector</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 800, color: "#D4AF37", marginBottom: 8, lineHeight: 1.15 }}>
            Start Collecting<br />Donations Today
          </div>
          <div style={{ fontSize: 14, color: "rgba(212,175,55,0.45)", marginBottom: 36 }}>
            Download the CollectiQ Collector App to record door-to-door donations with GPS tagging, offline mode, and instant sync.
          </div>

          {/* Mock phone */}
          <div style={{ position: "relative", display: "inline-block", marginBottom: 36 }}>
            <div style={{ width: 200, height: 360, borderRadius: 36, background: "#111", border: "6px solid #2A2A2A", padding: 8, boxShadow: "0 40px 80px rgba(0,0,0,0.7)", margin: "0 auto" }}>
              <div style={{ borderRadius: 28, background: "#1A0A04", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ background: `linear-gradient(160deg, #1A0A04, #3A1800)`, padding: "20px 14px 16px" }}>
                  <div style={{ fontSize: 10, color: "rgba(212,175,55,0.45)", marginBottom: 3 }}>Good afternoon 🙏</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 800, color: "#D4AF37" }}>Ramesh Kumar</div>
                  <div style={{ fontSize: 9, color: "rgba(212,175,55,0.35)", marginTop: 2 }}>📍 Satish Lane, Ward 5</div>
                  <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginTop: 12, border: "1px solid rgba(212,175,55,0.08)" }}>
                    <div style={{ fontSize: 8, color: "rgba(212,175,55,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Today's Collection</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: "#F5E090" }}>₹5,000</div>
                    <div style={{ fontSize: 9, color: "rgba(212,175,55,0.4)" }}>4 donations</div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginTop: 8 }}>
                      <div style={{ width: "33%", height: "100%", background: "#C97B2A", borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, background: "#FDF8EE", padding: "10px 10px" }}>
                  <div style={{ height: 44, borderRadius: 10, background: `linear-gradient(135deg, #C97B2A, #E8963A)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(201,123,42,0.4)" }}>
                    <span style={{ fontSize: 16 }}>+</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Record Donation</span>
                  </div>
                  <div style={{ marginTop: 8, background: "white", borderRadius: 10, padding: 8, border: "1px solid rgba(201,123,42,0.1)" }}>
                    {[["Suresh M.", "₹1,000", "✓"], ["Anjali D.", "₹500", "✓"], ["Ratan Das", "₹2,500", "⏳"]].map(([n, a, s]) => (
                      <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(201,123,42,0.08)", fontSize: 9 }}>
                        <span style={{ color: "#2C1A0E", fontWeight: 600 }}>{n}</span>
                        <span style={{ color: s === "✓" ? "#1E5C3A" : "#8B1A1A", fontWeight: 700 }}>{s} {a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { icon: "📱", label: "Download for Android", sub: "Google Play Store", color: "#1E5C3A" },
              { icon: "🍎", label: "Download for iOS", sub: "Apple App Store", color: "#2C1A0E" },
            ].map(b => (
              <button key={b.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 14, background: b.color, border: "none", cursor: "pointer", boxShadow: `0 4px 16px ${b.color}60` }}>
                <span style={{ fontSize: 22 }}>{b.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'Sora',sans-serif" }}>{b.sub}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white", fontFamily: "'Sora',sans-serif" }}>{b.label}</div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.5)", borderRadius: 10, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Sora',sans-serif" }}>← Back to Portal</button>
        </div>
      </div>
    );
  }

  // Admin or Auditor — navigate internally to /dashboard
  const isAdmin = role === "admin";
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: `linear-gradient(160deg, #1A0A04 0%, #0D0500 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 32,
      opacity: show ? 1 : 0, transition: "opacity 0.6s ease",
    }}>
      <div style={{ textAlign: "center", maxWidth: 540 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>{isAdmin ? "🏛" : "🛡"}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: "#D4AF37", marginBottom: 12 }}>
          {isAdmin ? "Admin Dashboard" : "Audit Portal"}
        </div>
        <div style={{ fontSize: 14, color: "rgba(212,175,55,0.5)", marginBottom: 40, maxWidth: 400, margin: "0 auto 40px" }}>
          {isAdmin
            ? "Full access to collections, expenses, collector management, and fraud detection."
            : "Read-only access to all financial records, GPS logs, and audit trails."}
        </div>

        {/* Dashboard mini-preview */}
        <div style={{ background: "#FFFBF3", borderRadius: 20, padding: 24, marginBottom: 32, textAlign: "left", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["Total Collected", "₹7,58,300", "#C97B2A"], ["Today", "₹36,200", "#1E5C3A"], ["Pending", "₹48,500", "#8B1A1A"]].map(([l, v, c]) => (
              <div key={l} style={{ background: "#FDF8EE", borderRadius: 12, padding: "12px 14px", border: `1px solid ${c}18` }}>
                <div style={{ fontSize: 10, color: "#7A5A3A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 6, background: "rgba(201,123,42,0.1)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
            {[["#E8963A", 29], ["#C97B2A", 35], ["#D4AF37", 18], ["#2D8A58", 10], ["#C46B3E", 8]].map(([c, w]) => (
              <div key={c} style={{ height: "100%", width: `${w}%`, background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#7A5A3A", marginTop: 6 }}>Expense breakdown across 6 categories</div>
        </div>

        {/* Internal navigation to /dashboard instead of window.open */}
        <button onClick={() => navigate("/dashboard")} style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "14px 32px", borderRadius: 14,
          background: `linear-gradient(135deg, #C97B2A, #E8963A)`,
          border: "none", color: "white",
          fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 700,
          cursor: "pointer", marginBottom: 16,
          boxShadow: "0 6px 24px rgba(201,123,42,0.45)",
        }}>
          → Open {isAdmin ? "Admin" : "Audit"} Dashboard
        </button>

        <div style={{ display: "block" }}>
          <button onClick={onBack} style={{ background: "none", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.5)", borderRadius: 10, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontFamily: "'Sora',sans-serif" }}>← Back to Portal</button>
        </div>
      </div>
    </div>
  );
}

// ── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({ icon, title, tagline, perks, color, delay, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered ? "#FFFBF3" : "rgba(255,251,243,0.04)",
        border: `1.5px solid ${hovered ? color + "60" : "rgba(201,123,42,0.18)"}`,
        borderRadius: 20, padding: "28px 24px 24px",
        cursor: "pointer", textAlign: "left",
        animation: `slideUp 0.7s ${delay}s both ease`,
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px ${color}30` : "0 4px 20px rgba(0,0,0,0.15)",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow top edge */}
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }} />

      <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: hovered ? "#2C1A0E" : "#D4AF37", marginBottom: 6, transition: "color 0.3s" }}>{title}</div>
      <div style={{ fontSize: 13, color: hovered ? "#7A5A3A" : "rgba(212,175,55,0.45)", marginBottom: 18, transition: "color 0.3s", fontFamily: "'Sora',sans-serif" }}>{tagline}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {perks.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0, opacity: 0.7 }} />
            <span style={{ fontSize: 12, color: hovered ? "#5C3D2E" : "rgba(212,175,55,0.4)", transition: "color 0.3s", fontFamily: "'Sora',sans-serif" }}>{p}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: hovered ? color + "30" : "rgba(201,123,42,0.12)", transition: "background 0.3s" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: hovered ? color : "rgba(212,175,55,0.3)", transition: "color 0.3s", fontFamily: "'Sora',sans-serif" }}>
          Sign In →
        </span>
      </div>
    </button>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [phase, setPhase] = useState("intro");   // intro → portal → signin → dest
  const [role, setRole] = useState(null);
  const [destRole, setDestRole] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const particles = useParticles(24);
  const introRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("portal"), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const openSignIn = (r) => { setRole(r); setPhase("signin"); };
  const closeSignIn = () => { setRole(null); setPhase("portal"); };
  const onSuccess = (r) => { setRole(null); setDestRole(r); setPhase("dest"); };
  const onBack = () => { setDestRole(null); setPhase("portal"); };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0500", fontFamily: "'Sora',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=Sora:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spinAnim{to{transform:rotate(360deg)}}
        @keyframes mandalaSpin{to{transform:rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes divaRise{0%{transform:translateY(0) translateX(0);opacity:0.7}100%{transform:translateY(-100vh) translateX(var(--drift,0px));opacity:0}}
        @keyframes slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeInScale{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes introReveal{0%{opacity:0;transform:scale(0.6)}60%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(201,123,42,0.25);border-radius:2px}
        button:not([style*='cursor: not-allowed']):active{transform:scale(0.97)!important}
      `}</style>

      {/* ── Particle field ──────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: "absolute",
            left: `${p.x}%`,
            bottom: 0,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, #D4AF37, #C97B2A88)`,
            "--drift": `${p.drift}px`,
            animation: `divaRise ${p.duration}s ${p.delay}s linear infinite`,
            opacity: 0,
          }} />
        ))}
      </div>

      {/* ── INTRO PHASE ─────────────────────────────────────────────────── */}
      {phase === "intro" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "linear-gradient(160deg, #1A0A04 0%, #080300 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 0,
        }}>
          <div style={{ animation: "introReveal 1.4s 0.2s both ease", position: "relative" }}>
            <MandalaHero size={280} glow spin />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: "#FFFBF3", letterSpacing: 2, textAlign: "center", lineHeight: 1.4 }}>🪔</div>
            </div>
          </div>
          <div style={{ animation: "slideUp 0.8s 1.2s both ease", textAlign: "center", marginTop: 24 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 800, color: "#D4AF37", letterSpacing: -1, lineHeight: 1 }}>CollectiQ</div>
            <div style={{ fontSize: 13, color: "rgba(212,175,55,0.45)", marginTop: 8, letterSpacing: 3, textTransform: "uppercase" }}>Festival Donation Platform</div>
          </div>
          <div style={{ animation: "pulse 1.5s 2s both ease infinite", marginTop: 48, fontSize: 11, color: "rgba(212,175,55,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>Loading portal…</div>
        </div>
      )}

      {/* ── PORTAL PHASE ────────────────────────────────────────────────── */}
      {(phase === "portal" || phase === "signin") && (
        <>
          {/* Nav */}
          <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
            background: scrollY > 40 ? "rgba(13,5,0,0.92)" : "transparent",
            backdropFilter: scrollY > 40 ? "blur(20px)" : "none",
            borderBottom: scrollY > 40 ? "1px solid rgba(212,175,55,0.08)" : "none",
            transition: "all 0.4s ease",
            padding: "16px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🪔</div>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 800, color: "#D4AF37" }}>CollectiQ</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Admin", "Collector", "Auditor"].map(r => (
                <button key={r} onClick={() => openSignIn(r.toLowerCase())} style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.target.style.borderColor = "rgba(212,175,55,0.5)"; e.target.style.color = "#D4AF37"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; e.target.style.color = "rgba(212,175,55,0.6)"; }}>
                  {r}
                </button>
              ))}
            </div>
          </nav>

          {/* Hero */}
          <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 32px 80px", position: "relative", textAlign: "center" }}>
            {/* Mandala background */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "mandalaSpin 120s linear infinite", opacity: 0.05 }}>
              <MandalaHero size={700} />
            </div>

            <div style={{ animation: "slideUp 0.9s 0.1s both ease", position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,123,42,0.12)", border: "1px solid rgba(201,123,42,0.25)", borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2D8A58", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(212,175,55,0.7)", letterSpacing: 0.8 }}>LIVE · Festival Collection Platform</span>
              </div>
            </div>

            <div style={{ animation: "slideUp 0.9s 0.25s both ease", position: "relative", zIndex: 2 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(42px,7vw,80px)", fontWeight: 800, color: "#FFFBF3", lineHeight: 1.08, letterSpacing: -2, marginBottom: 20 }}>
                Digitize your{" "}
                <span style={{ color: "#D4AF37", fontStyle: "italic", backgroundImage: "linear-gradient(135deg, #C97B2A, #D4AF37, #E8963A)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>
                  Festival
                </span>
                <br />Collections
              </h1>
            </div>

            <div style={{ animation: "slideUp 0.9s 0.4s both ease", position: "relative", zIndex: 2 }}>
              <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(212,175,55,0.5)", maxWidth: 560, margin: "0 auto 48px", lineHeight: 1.7 }}>
                GPS-tagged donations. Real-time transparency. Fraud detection.<br />
                Built for Durga Puja clubs, mandals & community organizations.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ animation: "slideUp 0.9s 0.55s both ease", display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", marginBottom: 64, position: "relative", zIndex: 2 }}>
              {[["₹13.8L+", "Tracked"], ["296", "Donors"], ["4", "Areas Covered"], ["100%", "Audit Trail"]].map(([v, l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: "#D4AF37" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "rgba(212,175,55,0.4)", textTransform: "uppercase", letterSpacing: 1, marginTop: 3, fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Enter portal CTA */}
            <div style={{ animation: "slideUp 0.9s 0.7s both ease", position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => document.getElementById("portal-section").scrollIntoView({ behavior: "smooth" })} style={{ padding: "16px 36px", borderRadius: 14, background: `linear-gradient(135deg, #C97B2A, #E8963A)`, border: "none", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif", boxShadow: "0 8px 32px rgba(201,123,42,0.45)", letterSpacing: 0.3 }}>
                  Enter Your Portal ↓
                </button>
                <a href="https://github.com/Infinite-Leo/CollectiQ" target="_blank" rel="noreferrer" style={{ padding: "16px 28px", borderRadius: 14, background: "transparent", border: "1px solid rgba(212,175,55,0.2)", color: "rgba(212,175,55,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  ⭐ GitHub
                </a>
              </div>
            </div>

            {/* Scroll indicator */}
            <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "float 2.5s ease infinite", opacity: 0.3 }}>
              <div style={{ width: 24, height: 38, borderRadius: 12, border: "1.5px solid rgba(212,175,55,0.35)", display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 4, height: 8, borderRadius: 2, background: "#D4AF37", animation: "float 1.5s ease infinite" }} />
              </div>
            </div>
          </section>

          {/* ── Portal Section ──────────────────────────────────────────── */}
          <section id="portal-section" style={{ padding: "80px 32px 120px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, color: "#FFFBF3", marginBottom: 14 }}>
                Choose Your Portal
              </div>
              <p style={{ fontSize: 15, color: "rgba(212,175,55,0.45)", maxWidth: 480, margin: "0 auto" }}>
                Different roles, same mission — transparent & efficient community fundraising.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
              <RoleCard
                icon="🏛"
                title="Admin"
                tagline="Club President · Secretary · Cashier"
                perks={["Real-time collection dashboard", "Expense tracking & breakdown", "Collector performance leaderboard", "Fraud detection & alerts", "PDF / Excel export"]}
                color="#C97B2A"
                delay={0}
                onClick={() => openSignIn("admin")}
              />
              <RoleCard
                icon="🪔"
                title="Collector"
                tagline="Field Collector · Door-to-door team"
                perks={["GPS-tagged donation entry", "Offline mode — works without internet", "Smart route map & navigation", "Instant digital receipts", "Sync when connected"]}
                color="#1E5C3A"
                delay={0.12}
                onClick={() => openSignIn("collector")}
              />
              <RoleCard
                icon="🛡"
                title="Auditor"
                tagline="Independent Financial Auditor"
                perks={["Read-only financial audit view", "Full GPS & timestamp logs", "Collector activity trail", "Fraud flag visibility", "Immutable record history"]}
                color="#4A2C1A"
                delay={0.24}
                onClick={() => openSignIn("auditor")}
              />
            </div>
          </section>

          {/* ── Features ribbon ─────────────────────────────────────────── */}
          <section style={{ padding: "40px 32px 80px", borderTop: "1px solid rgba(212,175,55,0.06)" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32 }}>
              {[
                ["📍", "GPS Proof", "Every donation GPS-tagged. Immutable audit trail."],
                ["☁", "Offline First", "Record even with no signal. Syncs automatically."],
                ["🛡", "Fraud Detection", "Automatic flags for anomalies and mismatches."],
                ["📊", "Live Dashboard", "Real-time area, collector & expense visibility."],
                ["📱", "Mobile App", "Field-optimized React Native collector app."],
                ["🧾", "Digital Receipts", "SMS/WhatsApp receipts to donors instantly."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#D4AF37", marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "rgba(212,175,55,0.4)", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer style={{ borderTop: "1px solid rgba(212,175,55,0.06)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🪔</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: "rgba(212,175,55,0.4)" }}>CollectiQ</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(212,175,55,0.25)" }}>
              Built by Anubhab Das · Academic Project · Durga Puja 2024
            </div>
            <a href="https://github.com/Infinite-Leo/CollectiQ" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "rgba(212,175,55,0.35)", textDecoration: "none" }}>
              GitHub →
            </a>
          </footer>
        </>
      )}

      {/* ── Sign-in Modal ──────────────────────────────────────────────── */}
      {phase === "signin" && role && (
        <SignInModal role={role} onClose={closeSignIn} onSuccess={onSuccess} />
      )}

      {/* ── Destination Screen ─────────────────────────────────────────── */}
      {phase === "dest" && destRole && (
        <DestinationScreen role={destRole} onBack={onBack} />
      )}
    </div>
  );
}
