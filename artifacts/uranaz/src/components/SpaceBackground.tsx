export default function SpaceBackground() {
  return (
    <>
      {/* Star field layer */}
      <div className="star-field" aria-hidden="true" />

      {/* Nebula colour wash */}
      <div className="nebula-overlay" aria-hidden="true" />

      {/* Uranus planet glow — top-right */}
      <div className="planet-glow planet-glow-primary" aria-hidden="true" />

      {/* Secondary nebula glow — bottom-left */}
      <div className="planet-glow planet-glow-secondary" aria-hidden="true" />

      {/* Uranus ring system (SVG ellipses) */}
      <div className="uranus-rings" aria-hidden="true">
        <svg viewBox="0 0 700 700" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer rings */}
          <ellipse cx="350" cy="350" rx="320" ry="120" stroke="#3DD6F5" strokeWidth="1.2" strokeDasharray="6 4" />
          <ellipse cx="350" cy="350" rx="290" ry="105" stroke="#a8edff" strokeWidth="0.8" />
          <ellipse cx="350" cy="350" rx="260" ry="90"  stroke="#3DD6F5" strokeWidth="1.5" strokeDasharray="4 8" />
          <ellipse cx="350" cy="350" rx="235" ry="78"  stroke="#2AB3CF" strokeWidth="0.6" />
          <ellipse cx="350" cy="350" rx="210" ry="65"  stroke="#3DD6F5" strokeWidth="1.0" strokeDasharray="8 6" />
          {/* Planet core glow */}
          <circle cx="350" cy="350" r="80" fill="url(#planetGrad)" opacity="0.6" />
          <defs>
            <radialGradient id="planetGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%"   stopColor="#a8edff" stopOpacity="0.9" />
              <stop offset="35%"  stopColor="#3DD6F5" stopOpacity="0.7" />
              <stop offset="70%"  stopColor="#2AB3CF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1a5a6e" stopOpacity="0.3" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Tiny floating particles */}
      <div
        aria-hidden="true"
        className="particle"
        style={{
          width: 4, height: 4,
          top: "20%", left: "15%",
          animation: "float-particle 7s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        className="particle"
        style={{
          width: 3, height: 3,
          top: "60%", left: "80%",
          animation: "float-particle 9s ease-in-out infinite",
          animationDelay: "-3s",
        }}
      />
      <div
        aria-hidden="true"
        className="particle"
        style={{
          width: 5, height: 5,
          top: "40%", left: "5%",
          animation: "float-particle 11s ease-in-out infinite",
          animationDelay: "-6s",
        }}
      />
      <div
        aria-hidden="true"
        className="particle"
        style={{
          width: 3, height: 3,
          top: "80%", left: "50%",
          animation: "float-particle 8s ease-in-out infinite",
          animationDelay: "-2s",
        }}
      />
      <div
        aria-hidden="true"
        className="particle"
        style={{
          width: 4, height: 4,
          top: "10%", left: "60%",
          animation: "float-particle 10s ease-in-out infinite",
          animationDelay: "-5s",
        }}
      />
    </>
  );
}
