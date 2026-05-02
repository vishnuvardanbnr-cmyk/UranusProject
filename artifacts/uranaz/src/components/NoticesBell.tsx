import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Bell, X, Pin, Info, CheckCircle2, AlertTriangle, AlertOctagon, Megaphone, Sparkles, ExternalLink } from "lucide-react";

const TEAL = "#3DD6F5";

interface Notice {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "critical" | "announcement" | "promo";
  priority: "low" | "normal" | "high" | "urgent";
  icon: string;
  ctaLabel: string;
  ctaUrl: string;
  pinned: boolean;
  dismissible: boolean;
  createdAt: string;
}

const TYPE_STYLES: Record<Notice["type"], { color: string; bg: string; border: string; Icon: any; label: string }> = {
  info:         { color: "#3DD6F5", bg: "rgba(61,214,245,0.10)",  border: "rgba(61,214,245,0.28)",  Icon: Info,         label: "Info" },
  success:      { color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.30)",  Icon: CheckCircle2, label: "Success" },
  warning:      { color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)",  Icon: AlertTriangle,label: "Warning" },
  critical:     { color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.30)", Icon: AlertOctagon, label: "Critical" },
  announcement: { color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.30)", Icon: Megaphone,    label: "Announcement" },
  promo:        { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.30)", Icon: Sparkles,     label: "Promo" },
};

const DISMISSED_KEY = "uranaz_dismissed_notices";

function getDismissed(): number[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; }
}
function saveDismissed(ids: number[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NoticesBell() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dismissed, setDismissed] = useState<number[]>(getDismissed());
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const token = localStorage.getItem("uranaz_token");
      if (!token) return;
      const r = await fetch("/api/notices/active", { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data)) setNotices(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // refresh every 60s
    return () => clearInterval(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Compute visible/unread
  const visible = notices.filter(n => n.pinned || !dismissed.includes(n.id));
  const unreadCount = notices.filter(n => !dismissed.includes(n.id)).length;
  const hasUrgent = notices.some(n => n.priority === "urgent" && !dismissed.includes(n.id));

  const dismissNotice = (id: number) => {
    const next = Array.from(new Set([...dismissed, id]));
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissAll = () => {
    const ids = notices.filter(n => n.dismissible && !n.pinned).map(n => n.id);
    const next = Array.from(new Set([...dismissed, ...ids]));
    setDismissed(next);
    saveDismissed(next);
  };

  const handleCta = (n: Notice) => {
    if (!n.ctaUrl) return;
    if (n.ctaUrl.startsWith("http://") || n.ctaUrl.startsWith("https://")) {
      window.open(n.ctaUrl, "_blank", "noopener,noreferrer");
    } else {
      setLocation(n.ctaUrl);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        data-testid="button-notices"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-all relative"
        style={{
          background: open ? "rgba(61,214,245,0.14)" : "rgba(61,214,245,0.06)",
          border: `1px solid ${open ? "rgba(61,214,245,0.45)" : "rgba(61,214,245,0.18)"}`,
          color: open ? TEAL : "rgba(168,237,255,0.55)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = TEAL;
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(61,214,245,0.45)";
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(168,237,255,0.55)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(61,214,245,0.18)";
          }
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold px-1"
            style={{
              background: hasUrgent ? "#f87171" : "linear-gradient(135deg, #3DD6F5, #2AB3CF)",
              color: hasUrgent ? "#fff" : "#010810",
              boxShadow: hasUrgent
                ? "0 0 8px rgba(248,113,113,0.7)"
                : "0 0 8px rgba(61,214,245,0.6)",
              animation: hasUrgent ? "noticePulse 1.4s ease-in-out infinite" : undefined,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        <style>{`@keyframes noticePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }`}</style>
      </button>

      {open && (
        <div
          className="fixed sm:absolute left-2 right-2 top-[60px] sm:top-auto sm:left-auto sm:right-0 sm:mt-2 sm:w-[380px] rounded-2xl overflow-hidden z-50"
          style={{
            background: "linear-gradient(155deg, rgba(4,16,32,0.98), rgba(2,10,22,0.98))",
            border: "1px solid rgba(61,214,245,0.22)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(61,214,245,0.08)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(61,214,245,0.10)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: TEAL }} />
              <span className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.9)", fontFamily: "'Orbitron',sans-serif" }}>
                Notifications
              </span>
              {visible.length > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(61,214,245,0.10)",
                    border: "1px solid rgba(61,214,245,0.22)",
                    color: TEAL,
                  }}
                >
                  {visible.length}
                </span>
              )}
            </div>
            {visible.some(n => n.dismissible && !n.pinned) && (
              <button
                onClick={dismissAll}
                className="text-[10px] font-medium transition-all hover:underline"
                style={{ color: "rgba(168,237,255,0.5)" }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto custom-scroll">
            {visible.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "rgba(61,214,245,0.06)", border: "1px solid rgba(61,214,245,0.12)" }}
                >
                  <Bell size={18} style={{ color: "rgba(168,237,255,0.35)" }} />
                </div>
                <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.6)" }}>You're all caught up</div>
                <div className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.3)" }}>No new notifications</div>
              </div>
            ) : (
              visible.map(n => {
                const s = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                const Icon = s.Icon;
                const isUnread = !dismissed.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className="px-4 py-3 transition-all"
                    style={{
                      borderBottom: "1px solid rgba(61,214,245,0.06)",
                      background: isUnread ? `linear-gradient(90deg, ${s.bg}, transparent 60%)` : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: s.bg, border: `1px solid ${s.border}` }}
                      >
                        {n.icon ? (
                          <span className="text-sm">{n.icon}</span>
                        ) : (
                          <Icon size={14} style={{ color: s.color }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          {n.pinned && <Pin size={10} style={{ color: TEAL }} />}
                          <span className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.95)" }}>
                            {n.title}
                          </span>
                          {n.priority === "urgent" && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}
                            >
                              Urgent
                            </span>
                          )}
                        </div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(168,237,255,0.65)" }}>
                          {n.message}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px]" style={{ color: "rgba(168,237,255,0.35)" }}>
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.ctaLabel && n.ctaUrl && (
                            <button
                              onClick={() => handleCta(n)}
                              className="text-[11px] font-semibold flex items-center gap-1 transition-all hover:opacity-80"
                              style={{ color: s.color }}
                            >
                              {n.ctaLabel}
                              <ExternalLink size={9} />
                            </button>
                          )}
                        </div>
                      </div>
                      {n.dismissible && !n.pinned && (
                        <button
                          onClick={() => dismissNotice(n.id)}
                          className="p-1 rounded-md transition-all flex-shrink-0"
                          style={{ color: "rgba(168,237,255,0.3)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "rgba(248,113,113,0.7)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(168,237,255,0.3)")}
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
