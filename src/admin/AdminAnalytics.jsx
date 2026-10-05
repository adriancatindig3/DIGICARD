import { useEffect, useRef, useState } from "react";

// ── Tiny animated donut ──────────────────────────────────────────────────────
const DonutChart = ({ segments, size = 140, stroke = 22, darkMode }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  const slices = segments.map((s) => {
    const pct = s.total > 0 ? s.value / s.total : 0;
    const len = pct * circ;
    const slice = { ...s, offset, len, pct };
    offset += len;
    return slice;
  });

  const total = segments[0]?.total || 0;
  const mainValue = segments.find((s) => s.main)?.value ?? total;
  const mainLabel = segments.find((s) => s.main)?.label ?? "Total";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        margin: "0 auto",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={darkMode ? "#374151" : "#e5e7eb"}
          strokeWidth={stroke}
        />
        {/* Segments */}
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${animated ? s.len : 0} ${circ}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
            style={{
              transition: `stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s`,
            }}
          />
        ))}
      </svg>
      {/* Center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: darkMode ? "#f9fafb" : "#111827",
            lineHeight: 1,
          }}
        >
          {mainValue}
        </span>
        <span
          style={{
            fontSize: "0.58rem",
            fontWeight: 600,
            color: darkMode ? "#6b7280" : "#9ca3af",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          {mainLabel}
        </span>
      </div>
    </div>
  );
};

// ── Animated horizontal bar ──────────────────────────────────────────────────
const HBar = ({ label, value, max, color, darkMode, rank }) => {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 120 + (rank || 0) * 60);
    return () => clearTimeout(t);
  }, [pct, rank]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "0.625rem",
      }}
    >
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          color: darkMode ? "#9ca3af" : "#6b7280",
          width: 90,
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: darkMode ? "#374151" : "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            width: `${width}%`,
            background: color,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: darkMode ? "#f9fafb" : "#374151",
            width: 28,
            textAlign: "right",
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            color: darkMode ? "#4b5563" : "#9ca3af",
            width: 30,
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
};

// ── Layout tile ──────────────────────────────────────────────────────────────
const LayoutTile = ({ num, value, max, color, darkMode, rank }) => {
  const [width, setWidth] = useState(0);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100 + rank * 50);
    return () => clearTimeout(t);
  }, [pct, rank]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.5rem 0.75rem",
        borderRadius: "0.5rem",
        background: darkMode ? "#111827" : "#f8fafc",
        border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
        marginBottom: "0.375rem",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "0.375rem",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}15`,
          border: `1px solid ${color}30`,
          fontSize: "0.65rem",
          fontWeight: 800,
          color,
        }}
      >
        L{num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: darkMode ? "#374151" : "#e5e7eb",
            overflow: "hidden",
            marginBottom: "0.25rem",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              background: color,
              width: `${width}%`,
              transition: `width 0.7s cubic-bezier(0.4,0,0.2,1) ${rank * 40}ms`,
            }}
          />
        </div>
        <div
          style={{
            fontSize: "0.6rem",
            color: darkMode ? "#6b7280" : "#9ca3af",
          }}
        >
          {value} user{value !== 1 ? "s" : ""}
        </div>
      </div>
      <span
        style={{ fontSize: "0.72rem", fontWeight: 700, color, flexShrink: 0 }}
      >
        {pct}%
      </span>
    </div>
  );
};

// ── Stat pill (clean version - no colored background) ────────────────────────
const StatPill = ({ label, value, color, darkMode }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.5rem 0",
      borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        style={{ width: 8, height: 8, borderRadius: "50%", background: color }}
      />
      <span
        style={{
          fontSize: "0.75rem",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
    <span
      style={{
        fontSize: "0.9rem",
        fontWeight: 700,
        color: darkMode ? "#f9fafb" : "#1f2937",
      }}
    >
      {value}
    </span>
  </div>
);

// ── Section card wrapper ──────────────────────────────────────────────────────
const Card = ({ title, accent, children, darkMode, fullSpan }) => (
  <div
    style={{
      background: darkMode ? "#1f2937" : "#ffffff",
      border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
      borderRadius: "0.875rem",
      padding: "1.25rem",
      gridColumn: fullSpan ? "1 / -1" : undefined,
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.1rem",
      }}
    >
      <div
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: accent,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: darkMode ? "#9ca3af" : "#6b7280",
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminAnalytics = ({ stats, users, darkMode, T, dynamicRoles }) => {
  const layoutCounts = users.reduce((acc, u) => {
    const l = u.selectedLayout || 1;
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});

  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  const C = {
    green: "#22c55e",
    yellow: "#f59e0b",
    red: "#ef4444",
    blue: "#3b82f6",
    purple: "#8b5cf6",
    cyan: "#06b6d4",
    orange: "#f97316",
    pink: "#ec4899",
    teal: "#14b8a6",
  };

  const layoutColors = [
    C.blue,
    C.purple,
    C.cyan,
    C.orange,
    C.pink,
    C.teal,
    C.green,
    C.yellow,
    C.red,
  ];

  // Top layout
  const topLayout = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce(
    (best, l) =>
      (layoutCounts[l] || 0) > (layoutCounts[best] || 0) ? l : best,
    1,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
      }}
    >
      {/* ── Account Status — Donut ── */}
      <Card title="Account Status" accent={C.green} darkMode={darkMode}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <DonutChart
            size={130}
            stroke={20}
            darkMode={darkMode}
            segments={[
              {
                label: "Approved",
                value: stats.approved,
                color: C.green,
                total: stats.total,
                main: true,
              },
              {
                label: "Pending",
                value: stats.pending,
                color: C.yellow,
                total: stats.total,
              },
              {
                label: "Rejected",
                value: stats.rejected,
                color: C.red,
                total: stats.total,
              },
            ]}
          />
          <div style={{ flex: 1, minWidth: 120 }}>
            <StatPill
              label="Approved"
              value={stats.approved}
              color={C.green}
              darkMode={darkMode}
            />
            <StatPill
              label="Pending"
              value={stats.pending}
              color={C.yellow}
              darkMode={darkMode}
            />
            <StatPill
              label="Rejected"
              value={stats.rejected}
              color={C.red}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Approval rate bar */}
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "0.625rem",
            background: darkMode ? "#111827" : "#f8fafc",
            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                color: darkMode ? "#9ca3af" : "#6b7280",
                fontWeight: 500,
              }}
            >
              Approval Rate
            </span>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: darkMode ? "#f9fafb" : "#1f2937",
              }}
            >
              {approvalRate}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: darkMode ? "#374151" : "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: C.green,
                width: `${approvalRate}%`,
                transition: "width 1s cubic-bezier(0.4,0,0.2,1) 0.3s",
              }}
            />
          </div>
        </div>
      </Card>

      {/* ── Role Distribution — H-Bars ── */}
      <Card title="Role Distribution" accent={C.blue} darkMode={darkMode}>
        {dynamicRoles.length > 0 ? (
          <>
            {dynamicRoles.map((r, i) => (
              <HBar
                key={r.id}
                label={r.label}
                value={
                  users.filter(
                    (u) =>
                      u.occupation?.toLowerCase().replace(/\s+/g, "-") ===
                      r.value,
                  ).length
                }
                max={stats.total}
                color={r.color || layoutColors[i % layoutColors.length]}
                darkMode={darkMode}
                rank={i}
              />
            ))}
            {/* Other / unassigned */}
            {(() => {
              const assigned = dynamicRoles.reduce(
                (sum, r) =>
                  sum +
                  users.filter(
                    (u) =>
                      u.occupation?.toLowerCase().replace(/\s+/g, "-") ===
                      r.value,
                  ).length,
                0,
              );
              const other = stats.total - assigned;
              return other > 0 ? (
                <HBar
                  label="Other"
                  value={other}
                  max={stats.total}
                  color={darkMode ? "#6b7280" : "#9ca3af"}
                  darkMode={darkMode}
                  rank={dynamicRoles.length}
                />
              ) : null;
            })()}
          </>
        ) : (
          <>
            <HBar
              label="Teaching"
              value={stats.teaching || 0}
              max={stats.total}
              color={C.blue}
              darkMode={darkMode}
              rank={0}
            />
            <HBar
              label="Non-Teaching"
              value={stats.nonTeaching || 0}
              max={stats.total}
              color={C.purple}
              darkMode={darkMode}
              rank={1}
            />
            <HBar
              label="Alumni"
              value={stats.alumni || 0}
              max={stats.total}
              color={C.yellow}
              darkMode={darkMode}
              rank={2}
            />
          </>
        )}

        {/* Total users badge */}
        <div
          style={{
            marginTop: "0.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.6rem 0.875rem",
            borderRadius: "0.5rem",
            background: darkMode ? "#111827" : "#f8fafc",
            border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: darkMode ? "#6b7280" : "#9ca3af",
              fontWeight: 500,
            }}
          >
            Total registered
          </span>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: darkMode ? "#f9fafb" : "#1f2937",
            }}
          >
            {stats.total}
          </span>
        </div>
      </Card>

      {/* ── Layout Popularity — Ranked tiles ── */}
      <Card title="Layout Popularity" accent={C.purple} darkMode={darkMode}>
        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              padding: "0.2rem 0.625rem",
              borderRadius: "2rem",
              fontSize: "0.65rem",
              fontWeight: 700,
              background: `${C.purple}10`,
              border: `1px solid ${C.purple}25`,
              color: C.purple,
            }}
          >
            🏆 Layout {topLayout} most popular
          </div>
        </div>

        <div style={{ maxHeight: 310, overflowY: "auto", paddingRight: 2 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map((l) => ({ num: l, value: layoutCounts[l] || 0 }))
            .sort((a, b) => b.value - a.value)
            .map((item, i) => (
              <LayoutTile
                key={item.num}
                num={item.num}
                value={item.value}
                max={stats.total || 1}
                color={layoutColors[(item.num - 1) % layoutColors.length]}
                darkMode={darkMode}
                rank={i}
              />
            ))}
        </div>
      </Card>

      {/* ── Quick Insights — clean numbers, no color chaos ── */}
      <Card title="Quick Insights" accent={C.cyan} darkMode={darkMode} fullSpan>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "0.625rem",
          }}
        >
          {[
            {
              label: "Total Users",
              value: stats.total,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
            {
              label: "Active",
              value: stats.approved,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
            {
              label: "Pending Review",
              value: stats.pending,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
            {
              label: "Rejected",
              value: stats.rejected,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
            {
              label: "Approval Rate",
              value: `${approvalRate}%`,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
            {
              label: "Roles Defined",
              value: dynamicRoles.length,
              color: darkMode ? "#f9fafb" : "#1f2937",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "0.875rem",
                borderRadius: "0.625rem",
                background: darkMode ? "#111827" : "#f8fafc",
                border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.625rem",
                  fontWeight: 800,
                  color: item.color,
                  lineHeight: 1,
                  marginBottom: "0.3rem",
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: darkMode ? "#6b7280" : "#9ca3af",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
