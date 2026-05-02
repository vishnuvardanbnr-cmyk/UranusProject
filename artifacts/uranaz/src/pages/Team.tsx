import { useGetTeam, useGetTeamStats } from "@workspace/api-client-react";
import { Users, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const levelUnlockRequirements: Record<number, number> = {
  1: 0, 2: 1000, 3: 3000, 4: 10000, 5: 10000, 6: 10000, 7: 10000, 8: 10000,
};

const levelCommissions: Record<number, string> = {
  1: "20%", 2: "10%", 3: "10%", 4: "4%", 5: "4%", 6: "4%", 7: "4%", 8: "4%",
};

export default function Team({ user }: { user: any }) {
  const { data: team, isLoading: loadingTeam } = useGetTeam();
  const { data: stats, isLoading: loadingStats } = useGetTeamStats();
  const [expanded, setExpanded] = useState<number[]>([1]);

  const toggleLevel = (level: number) => {
    setExpanded(prev => prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]);
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-xl font-bold">My Team</h1>

      {/* Team Stats */}
      {loadingStats ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl h-20 animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Members", value: stats.totalMembers },
            { label: "Direct Referrals", value: stats.directReferrals },
            { label: "Active Members", value: stats.activeMembers },
            { label: "Levels Unlocked", value: `${stats.levelsUnlocked} / 8` },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xl font-bold text-primary">{item.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Total Team Business */}
      {stats && (
        <div className="bg-gradient-to-br from-primary/10 to-amber-700/5 border border-primary/20 rounded-2xl p-5">
          <div className="text-xs text-muted-foreground mb-1">Total Team Business</div>
          <div className="text-3xl font-bold text-primary">${stats.totalTeamBusiness.toFixed(2)}</div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Level {user?.currentLevel} → Level {user?.currentLevel + 1}</span>
              {(stats.nextLevelRequirement ?? 0) > 0 && (
                <span>${stats.totalTeamBusiness.toFixed(0)} / ${(stats.nextLevelRequirement ?? 0).toLocaleString()}</span>
              )}
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.nextLevelProgress ?? 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3-Leg Stats */}
      {stats?.lugsStats && stats.lugsStats.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-3">Leg Business</h2>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(leg => {
              const lugData = stats.lugsStats.find(l => l.lugIndex === leg);
              return (
                <div key={leg} className="bg-card border border-border rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Leg {leg}</div>
                  <div className="font-bold text-sm">${(lugData?.business ?? 0).toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Level Commission Summary */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Level Commission Structure</h2>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {[1,2,3,4,5,6,7,8].map(level => {
            const unlocked = level <= (user?.currentLevel ?? 0) || level === 1;
            return (
              <div key={level} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {level}
                  </div>
                  <div className="text-sm">Level {level}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
                    {levelCommissions[level]}
                  </div>
                  {!unlocked && (
                    <div className="text-xs text-muted-foreground">Earn ${levelUnlockRequirements[level]?.toLocaleString()}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Levels */}
      {loadingTeam ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />)}
        </div>
      ) : (
        <div>
          <h2 className="font-semibold text-sm mb-3">Team Members</h2>
          {!team?.levels?.length ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Users size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1">Share your referral link to build your team</p>
            </div>
          ) : (
            <div className="space-y-2">
              {team.levels.map(({ level, members, totalBusiness }) => (
                <div key={level} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    data-testid={`button-level-${level}`}
                    onClick={() => toggleLevel(level)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        L{level}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold">{members.length} member{members.length !== 1 ? "s" : ""}</div>
                        <div className="text-xs text-muted-foreground">Business: ${totalBusiness.toFixed(2)}</div>
                      </div>
                    </div>
                    {expanded.includes(level) ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  </button>
                  {expanded.includes(level) && members.length > 0 && (
                    <div className="border-t border-border divide-y divide-border">
                      {members.map(member => (
                        <div key={member.id} data-testid={`row-member-${member.id}`} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.directReferrals} referrals · {member.isActive ? "Active" : "Inactive"}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">${member.totalInvested.toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">invested</div>
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
