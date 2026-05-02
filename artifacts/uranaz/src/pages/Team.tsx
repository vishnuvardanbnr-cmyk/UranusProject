import { useGetTeam, useGetTeamStats } from "@workspace/api-client-react";
import { Users, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const TEAL = "#3DD6F5";
const GLASS = { background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" } as const;

const levelCommissions: Record<number, string> = {
  1: "20%", 2: "10%", 3: "10%", 4: "4%", 5: "4%", 6: "4%", 7: "4%", 8: "4%",
};
const levelUnlockRequirements: Record<number, number> = {
  1: 0, 2: 1000, 3: 3000, 4: 10000, 5: 10000, 6: 10000, 7: 10000, 8: 10000,
};

export default function Team({ user }: { user: any }) {
  const { data: team, isLoading: loadingTeam } = useGetTeam();
  const { data: stats, isLoading: loadingStats } = useGetTeamStats();
  const [expanded, setExpanded] = useState<number[]>([1]);

  const toggleLevel = (level: number) =>
    setExpanded(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <h1
        className="text-xl font-bold"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        My Team
      </h1>

      {/* Stats grid */}
      {loadingStats ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Members",    value: stats.totalMembers },
            { label: "Direct Referrals", value: stats.directReferrals },
            { label: "Active Members",   value: stats.activeMembers },
            { label: "Levels Unlocked",  value: `${stats.levelsUnlocked} / 8` },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-4" style={GLASS}>
              <div className="text-xl font-bold" style={{ color: TEAL }}>{item.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(168,237,255,0.4)" }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Team business hero */}
      {stats && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(61,214,245,0.10), rgba(42,179,215,0.05))",
            border: "1px solid rgba(61,214,245,0.22)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(61,214,245,0.14) 0%, transparent 60%)" }} />
          <div className="relative">
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(168,237,255,0.45)" }}>Total Team Business</div>
            <div
              className="text-3xl font-black"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                background: "linear-gradient(135deg, #a8edff, #3DD6F5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ${stats.totalTeamBusiness.toFixed(2)}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(168,237,255,0.4)" }}>
                <span>Level {user?.currentLevel} → Level {user?.currentLevel + 1}</span>
                {(stats.nextLevelRequirement ?? 0) > 0 && (
                  <span>${stats.totalTeamBusiness.toFixed(0)} / ${(stats.nextLevelRequirement ?? 0).toLocaleString()}</span>
                )}
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "rgba(61,214,245,0.08)" }}>
                <div
                  className="h-2 rounded-full uranus-progress"
                  style={{ width: `${Math.min(100, stats.nextLevelProgress ?? 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leg stats */}
      {stats?.lugsStats && stats.lugsStats.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Leg Business</h2>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(leg => {
              const lugData = stats.lugsStats.find(l => l.lugIndex === leg);
              return (
                <div key={leg} className="rounded-xl p-3 text-center" style={GLASS}>
                  <div className="text-xs mb-1" style={{ color: "rgba(168,237,255,0.4)" }}>Leg {leg}</div>
                  <div className="font-bold text-sm" style={{ color: "rgba(168,237,255,0.85)" }}>
                    ${(lugData?.business ?? 0).toFixed(0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Level commission table */}
      <div>
        <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Level Commission Structure</h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "rgba(5,18,32,0.65)", backdropFilter: "blur(14px)", border: "1px solid rgba(61,214,245,0.10)" }}
        >
          {[1,2,3,4,5,6,7,8].map((level, idx) => {
            const unlocked = level <= (user?.currentLevel ?? 0) || level === 1;
            return (
              <div
                key={level}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: idx > 0 ? "1px solid rgba(61,214,245,0.07)" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      background: unlocked ? "rgba(61,214,245,0.12)" : "rgba(255,255,255,0.04)",
                      border: unlocked ? "1px solid rgba(61,214,245,0.2)" : "1px solid rgba(255,255,255,0.06)",
                      color: unlocked ? TEAL : "rgba(168,237,255,0.25)",
                    }}
                  >
                    {level}
                  </div>
                  <div className="text-sm" style={{ color: unlocked ? "rgba(168,237,255,0.75)" : "rgba(168,237,255,0.3)" }}>
                    Level {level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: unlocked ? TEAL : "rgba(168,237,255,0.25)" }}>
                    {levelCommissions[level]}
                  </div>
                  {!unlocked && (
                    <div className="text-xs" style={{ color: "rgba(168,237,255,0.25)" }}>
                      Earn ${levelUnlockRequirements[level]?.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team members by level */}
      {loadingTeam ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "rgba(61,214,245,0.04)", border: "1px solid rgba(61,214,245,0.08)" }} />)}
        </div>
      ) : (
        <div>
          <h2 className="font-semibold text-sm mb-3" style={{ color: "rgba(168,237,255,0.75)" }}>Team Members</h2>
          {!team?.levels?.length ? (
            <div className="rounded-xl p-8 text-center" style={GLASS}>
              <Users size={32} className="mx-auto mb-2" style={{ color: "rgba(168,237,255,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(168,237,255,0.35)" }}>No team members yet</p>
              <p className="text-xs mt-1" style={{ color: "rgba(168,237,255,0.25)" }}>Share your referral link to build your team</p>
            </div>
          ) : (
            <div className="space-y-2">
              {team.levels.map(({ level, members, totalBusiness }) => (
                <div
                  key={level}
                  className="rounded-xl overflow-hidden"
                  style={GLASS}
                >
                  <button
                    data-testid={`button-level-${level}`}
                    onClick={() => toggleLevel(level)}
                    className="w-full flex items-center justify-between px-4 py-3.5 transition-all"
                    style={{ background: "transparent" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "rgba(61,214,245,0.12)",
                          border: "1px solid rgba(61,214,245,0.2)",
                          color: TEAL,
                        }}
                      >
                        L{level}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.8)" }}>
                          {members.length} member{members.length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
                          Business: ${totalBusiness.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {expanded.includes(level)
                      ? <ChevronDown size={16} style={{ color: "rgba(168,237,255,0.3)" }} />
                      : <ChevronRight size={16} style={{ color: "rgba(168,237,255,0.3)" }} />
                    }
                  </button>
                  {expanded.includes(level) && members.length > 0 && (
                    <div style={{ borderTop: "1px solid rgba(61,214,245,0.07)" }}>
                      {members.map((member, idx) => (
                        <div
                          key={member.id}
                          data-testid={`row-member-${member.id}`}
                          className="px-4 py-3 flex items-center justify-between"
                          style={{ borderTop: idx > 0 ? "1px solid rgba(61,214,245,0.05)" : "none" }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                background: "rgba(61,214,245,0.08)",
                                border: "1px solid rgba(61,214,245,0.15)",
                                color: TEAL,
                              }}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: "rgba(168,237,255,0.8)" }}>{member.name}</div>
                              <div className="text-xs" style={{ color: "rgba(168,237,255,0.35)" }}>
                                {member.directReferrals} referrals · {member.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold" style={{ color: "rgba(168,237,255,0.75)" }}>
                              ${member.totalInvested.toFixed(0)}
                            </div>
                            <div className="text-xs" style={{ color: "rgba(168,237,255,0.3)" }}>invested</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
