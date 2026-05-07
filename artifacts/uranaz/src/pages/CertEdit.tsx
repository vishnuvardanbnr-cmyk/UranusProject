import { useState } from "react";
import { KeyRound, Save, CheckCircle, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function CertEdit() {
  const [key, setKey]         = useState("");
  const [authed, setAuthed]   = useState(false);
  const [checking, setChecking] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [companyName, setCompanyName]       = useState("");
  const [companyNumber, setCompanyNumber]   = useState("");
  const [incorporatedDate, setIncorporatedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setKeyError("");
    setChecking(true);
    try {
      // Validate the key by fetching current config with it
      const probe = await fetch(`${BASE}/api/cert-config`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-cert-key": key },
        body: JSON.stringify({ companyName: "_probe_", companyNumber: "_probe_", incorporatedDate: "_probe_" }),
      });
      if (probe.status === 401) { setKeyError("Wrong key. Try again."); return; }

      // Key is valid — load current values then restore them
      const cur = await fetch(`${BASE}/api/cert-config`).then(r => r.json());
      setCompanyName(cur.companyName);
      setCompanyNumber(cur.companyNumber);
      setIncorporatedDate(cur.incorporatedDate);

      // Restore the values we just overwrote with the probe
      await fetch(`${BASE}/api/cert-config`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-cert-key": key },
        body: JSON.stringify({
          companyName: cur.companyName,
          companyNumber: cur.companyNumber,
          incorporatedDate: cur.incorporatedDate,
        }),
      });

      setAuthed(true);
    } catch {
      setKeyError("Connection error. Try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/cert-config`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-cert-key": key },
        body: JSON.stringify({ companyName, companyNumber, incorporatedDate }),
      });
      if (!res.ok) { setSaveError("Save failed. Try again."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Connection error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#010810" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(61,214,245,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(61,214,245,0.025) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(61,214,245,0.10)",
              border: "1px solid rgba(61,214,245,0.25)",
            }}
          >
            <KeyRound size={20} style={{ color: "#3DD6F5" }} />
          </div>
          <h1
            className="text-xl font-black mb-1"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "rgba(200,240,255,0.90)" }}
          >
            Certificate Config
          </h1>
          <p className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
            Edit the certificate of incorporation details
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(5,18,32,0.80)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(61,214,245,0.13)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {!authed ? (
            /* ── Key form ── */
            <form onSubmit={handleUnlock} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(168,237,255,0.55)" }}>
                  Access Key
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="Enter access key"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "rgba(1,12,24,0.70)",
                    border: `1px solid ${keyError ? "rgba(248,113,113,0.5)" : "rgba(61,214,245,0.15)"}`,
                    color: "rgba(200,240,255,0.90)",
                  }}
                />
                {keyError && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#f87171" }}>
                    <AlertCircle size={12} /> {keyError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={checking}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, rgba(61,214,245,0.25), rgba(42,179,215,0.15))",
                  border: "1px solid rgba(61,214,245,0.35)",
                  color: "#3DD6F5",
                }}
              >
                {checking ? "Checking…" : "Unlock"}
              </button>
            </form>
          ) : (
            /* ── Edit form ── */
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {[
                { label: "Company Name",      value: companyName,       set: setCompanyName,       placeholder: "e.g. URANUS INVESTMENT LTD" },
                { label: "Company Number",    value: companyNumber,     set: setCompanyNumber,     placeholder: "e.g. 14309852" },
                { label: "Incorporated Date", value: incorporatedDate,  set: setIncorporatedDate,  placeholder: "e.g. 22nd August 2022" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(168,237,255,0.55)" }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(1,12,24,0.70)",
                      border: "1px solid rgba(61,214,245,0.15)",
                      color: "rgba(200,240,255,0.90)",
                    }}
                  />
                </div>
              ))}

              {saveError && (
                <p className="text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
                  <AlertCircle size={12} /> {saveError}
                </p>
              )}
              {saved && (
                <p className="text-xs flex items-center gap-1" style={{ color: "#34d399" }}>
                  <CheckCircle size={12} /> Saved successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, rgba(61,214,245,0.25), rgba(42,179,215,0.15))",
                  border: "1px solid rgba(61,214,245,0.35)",
                  color: "#3DD6F5",
                }}
              >
                <Save size={14} />
                {saving ? "Saving…" : "Save Changes"}
              </button>

              <p className="text-center text-xs" style={{ color: "rgba(168,237,255,0.25)" }}>
                Changes take effect immediately on the About page.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
