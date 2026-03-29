import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStats, type Stats } from "@/services/api";
import { StatCard } from "@/components/ui/stat-card";
import { ClassificationBadge } from "@/components/ui/classification-badge";
import { ScoreBar } from "@/components/ui/score-bar";
import {
  PawPrint, Shield, AlertTriangle, MinusCircle,
  TrendingUp, BarChart3, MapPin, ArrowRight, Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = {
  PRO: "#22c55e",
  ANTI: "#ef4444",
  NEUTRAL: "#6b7280",
};

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const pieData = stats ? [
    { name: "Pro-Animal", value: stats.pro, color: COLORS.PRO },
    { name: "Anti-Animal", value: stats.anti, color: COLORS.ANTI },
    { name: "Neutral", value: stats.neutral, color: COLORS.NEUTRAL },
  ].filter(d => d.value > 0) : [];

  const stateData = stats ? Object.entries(stats.state_breakdown).map(([state, data]) => ({
    state,
    PRO: data.PRO,
    ANTI: data.ANTI,
    NEUTRAL: data.NEUTRAL,
    total: data.total,
  })) : [];

  return (
    <div className="space-y-8">
      {/* ── Hero Section (Web3-inspired) ── */}
      <section className="relative overflow-hidden rounded-3xl border border-border">
        {/* Background gradients */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: [
              "radial-gradient(80% 60% at 50% 55%, rgba(168,85,247,0.25) 0%, rgba(236,72,153,0.2) 30%, rgba(12,12,20,0.9) 65%, rgba(5,5,7,1) 85%)",
              "radial-gradient(60% 50% at 15% 10%, rgba(168,85,247,0.3) 0%, transparent 60%)",
              "radial-gradient(50% 40% at 85% 20%, rgba(34,197,94,0.15) 0%, transparent 55%)",
            ].join(","),
            backgroundColor: "var(--color-background)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 -z-5 opacity-20 mix-blend-screen"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 80px)",
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 80px)",
            ].join(","),
          }}
        />

        <div className="relative z-10 px-8 py-16 md:px-12 md:py-20 text-center">
          <div className={`${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70 ring-1 ring-white/10 backdrop-blur mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-pro animate-pulse" />
              Real-time legislation monitoring
            </span>
          </div>

          <h1
            className={`text-4xl md:text-6xl font-bold tracking-tight mb-5 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
            style={{ animationDelay: '150ms' }}
          >
            <span className="gradient-text">Track & Protect</span>
            <br />
            <span className="text-white">Animal Legislation</span>
          </h1>

          <p
            className={`mx-auto max-w-2xl text-white/70 md:text-lg text-balance mb-8 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
            style={{ animationDelay: '250ms' }}
          >
            Monitor bills across US states, classify their impact on animals, and stay
            informed with AI-powered scoring and weekly digests.
          </p>

          <div
            className={`flex items-center justify-center gap-4 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
            style={{ animationDelay: '350ms' }}
          >
            <button
              onClick={() => navigate("/bills")}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 hover:scale-[1.03] active:scale-[0.97]"
            >
              Explore Bills
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate("/digest")}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur hover:border-white/40 transition"
            >
              View Digest
            </button>
          </div>

          {/* Pillar silhouettes */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-[2px] px-[2px]">
              {[88, 80, 72, 64, 56, 48, 40, 28, 14, 28, 40, 48, 56, 64, 72, 80, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: isMounted ? `${h}%` : '0%',
                    background: 'var(--color-background)',
                    transition: 'height 0.8s ease-in-out',
                    transitionDelay: `${Math.abs(i - 8) * 50 + 400}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Cards (Bento Grid) ── */}
      {stats && (
        <div
          className={`grid gap-4 grid-cols-2 lg:grid-cols-4 ${isMounted ? 'animate-fadeInUp' : 'opacity-0'}`}
          style={{ animationDelay: '500ms' }}
        >
          <StatCard
            label="Total Bills"
            value={stats.total}
            icon={<PawPrint className="h-5 w-5 text-accent" />}
            variant="accent"
          />
          <StatCard
            label="Pro-Animal"
            value={stats.pro}
            icon={<Shield className="h-5 w-5 text-pro" />}
            variant="pro"
            trend={stats.total ? `${((stats.pro / stats.total) * 100).toFixed(0)}% of total` : undefined}
          />
          <StatCard
            label="Anti-Animal"
            value={stats.anti}
            icon={<AlertTriangle className="h-5 w-5 text-anti" />}
            variant="anti"
            trend={stats.total ? `${((stats.anti / stats.total) * 100).toFixed(0)}% of total` : undefined}
          />
          <StatCard
            label="Neutral"
            value={stats.neutral}
            icon={<MinusCircle className="h-5 w-5 text-neutral" />}
            variant="neutral"
          />
        </div>
      )}

      {/* ── Charts Row ── */}
      {stats && stats.total > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Classification Distribution */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              Classification Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      color: "var(--color-text)",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          {/* Bills By State */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              Bills By State
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="state" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      color: "var(--color-text)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="PRO" fill={COLORS.PRO} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ANTI" fill={COLORS.ANTI} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NEUTRAL" fill={COLORS.NEUTRAL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Average Score + Score Distribution ── */}
      {stats && stats.total > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
            <TrendingUp className="h-6 w-6 text-accent mb-3" />
            <p className="text-xs uppercase tracking-widest text-text-muted mb-2">Average Score</p>
            <p className="text-4xl font-bold gradient-text">{stats.average_score}</p>
            <div className="w-full mt-4">
              <ScoreBar score={stats.average_score} />
            </div>
          </div>

          <div className="glass rounded-2xl p-6 md:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Score Distribution</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="range" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      color: "var(--color-text)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(stats.score_distribution || []).map((_, index) => (
                      <Cell
                        key={index}
                        fill={`hsl(${270 + index * 12}, 70%, 55%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Bills ── */}
      {stats && stats.recent_bills && stats.recent_bills.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Recent Bills</h2>
            <button onClick={() => navigate("/bills")} className="text-xs text-accent hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {stats.recent_bills.map(bill => (
              <div
                key={bill.bill_id}
                onClick={() => navigate(`/bills/${bill.bill_id}`)}
                className="flex items-center gap-4 rounded-xl bg-surface-2/50 p-4 cursor-pointer hover:bg-surface-2 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-accent">{bill.bill_number}</span>
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{bill.state}
                    </span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">{bill.title}</p>
                </div>
                <ClassificationBadge classification={bill.classification} size="sm" />
                <div className="hidden sm:block w-24">
                  <ScoreBar score={bill.score} size="sm" showLabel={false} />
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {stats && stats.total === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <PawPrint className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No bills tracked yet</h2>
          <p className="text-text-muted mb-6">Run the pipeline to start fetching and classifying animal-related legislation.</p>
          <p className="text-sm text-text-muted">Click the <span className="text-accent font-semibold">Run Pipeline</span> button in the navbar to get started.</p>
        </div>
      )}
    </div>
  );
}
