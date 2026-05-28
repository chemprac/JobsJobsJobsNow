type StatsBarProps = {
  total: number;
  tierA: number;
  tierB: number;
  applied: number;
  interviewing: number;
};

export function StatsBar({ total, tierA, tierB, applied, interviewing }: StatsBarProps) {
  const stats = [
    ["Total jobs", total],
    ["Tier A", tierA],
    ["Tier B", tierB],
    ["Applied", applied],
    ["Interviewing", interviewing]
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-app-border bg-white/5 p-3">
          <p className="text-xs text-neutral-400">{label}</p>
          <p className="mt-1 text-xl font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}
