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
  lastScraped: string | null;
  isScraping: boolean;
  onTierChange: (tier: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onScrape: () => void;
};

const tierOptions = ["All", "A", "B", "C"];
const statusOptions = ["new", "reviewing", "applied", "rejected", "interviewing"];

export function Sidebar({
  stats,
  tier,
  status,
  search,
  lastScraped,
  isScraping,
  onTierChange,
  onStatusChange,
  onSearchChange,
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

        <button
          onClick={onScrape}
          disabled={isScraping}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isScraping ? "Scraping..." : "Scrape Now"}
        </button>

        <p className="text-xs text-neutral-500">Last scraped: {lastScraped ? new Date(lastScraped).toLocaleString() : "No jobs yet"}</p>
      </div>
    </aside>
  );
}
