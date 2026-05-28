"use client";

import { StatsBar } from "./StatsBar";

type SidebarProps = {
  stats: {
    total: number;
    tierA: number;
    tierB: number;
    applied: number;
    interviewing: number;
  };
  tier: string;
  status: string;
  search: string;
  searchUrl: string;
  lastScraped: string | null;
  isScraping: boolean;
  onTierChange: (tier: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onSearchUrlChange: (searchUrl: string) => void;
  onScrape: () => void;
};

const tierOptions = ["All", "A", "B", "C"];
const statusOptions = ["new", "reviewing", "applied", "rejected", "interviewing"];

function formatRelativeTime(value: string | null) {
  if (!value) return "Never scraped";

  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) return "Last scraped: just now";

  const units = [
    { label: "year", seconds: 60 * 60 * 24 * 365 },
    { label: "month", seconds: 60 * 60 * 24 * 30 },
    { label: "day", seconds: 60 * 60 * 24 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 }
  ];
  const unit = units.find((item) => diffSeconds >= item.seconds);

  if (!unit) return "Last scraped: just now";

  const count = Math.floor(diffSeconds / unit.seconds);
  return `Last scraped: ${count} ${unit.label}${count === 1 ? "" : "s"} ago`;
}

export function Sidebar({
  stats,
  tier,
  status,
  search,
  searchUrl,
  lastScraped,
  isScraping,
  onTierChange,
  onStatusChange,
  onSearchChange,
  onSearchUrlChange,
  onScrape
}: SidebarProps) {
  return (
    <aside className="min-h-screen w-full border-r border-app-border bg-black/40 p-6 lg:sticky lg:top-0 lg:w-80">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-400">Personal</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Job Scout</h1>
      </div>

      <StatsBar {...stats} />

      <div className="mt-8 space-y-6">
        <div>
          <p className="mb-3 text-sm font-semibold text-neutral-300">Match tier</p>
          <div className="grid grid-cols-2 gap-2">
            {tierOptions.map((option) => {
              const value = option === "All" ? "" : option;
              const active = tier === value;
              return (
                <button
                  key={option}
                  onClick={() => onTierChange(value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    active ? "border-emerald-500 bg-emerald-500 text-black" : "border-app-border bg-white/5 text-neutral-300 hover:bg-white/10"
                  }`}
                >
                  {option === "All" ? "All" : `Tier ${option}`}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-neutral-300">Status</p>
          <div className="space-y-2">
            <button
              onClick={() => onStatusChange("")}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm capitalize transition ${
                !status ? "border-emerald-500 bg-emerald-500 text-black" : "border-app-border bg-white/5 text-neutral-300 hover:bg-white/10"
              }`}
            >
              All statuses
            </button>
            {statusOptions.map((option) => (
              <button
                key={option}
                onClick={() => onStatusChange(option)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm capitalize transition ${
                  status === option
                    ? "border-emerald-500 bg-emerald-500 text-black"
                    : "border-app-border bg-white/5 text-neutral-300 hover:bg-white/10"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-300">Search</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Title or company"
            className="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 text-sm text-white outline-none ring-emerald-500 transition placeholder:text-neutral-500 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-neutral-300">LinkedIn search URL</span>
          <textarea
            value={searchUrl}
            onChange={(event) => onSearchUrlChange(event.target.value)}
            placeholder="Paste a LinkedIn jobs search URL with your filters"
            rows={4}
            className="w-full rounded-xl border border-app-border bg-app-card px-4 py-3 text-xs leading-5 text-white outline-none ring-emerald-500 transition placeholder:text-neutral-500 focus:ring-2"
          />
          <p className="mt-2 text-xs text-neutral-500">Scrapes up to 150 jobs from this search.</p>
        </label>

        <div className="space-y-2">
          <button
            onClick={onScrape}
            disabled={isScraping || !searchUrl.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isScraping ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : null}
            {isScraping ? "Scraping..." : "Scrape Now"}
          </button>
          <p className="text-xs text-neutral-500">{formatRelativeTime(lastScraped)}</p>
        </div>
      </div>
    </aside>
  );
}
