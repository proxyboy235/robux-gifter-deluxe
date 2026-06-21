import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { lookupRobloxUser } from "@/lib/roblox.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robux Gifting" },
      { name: "description", content: "Send Robux gifts to your clients instantly." },
    ],
  }),
  component: Index,
});

const AMOUNTS = [
  10_000, 20_000, 30_000, 50_000, 75_000, 100_000,
  150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
];

const fmt = (n: number) => n.toLocaleString("en-US");

type Gift = { id: number; username: string; amount: number; at: string };

function RobuxIcon({ className = "h-5 w-5" }: { className?: string }) {
  // Authentic-style Robux glyph: angular hex with R cutout
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="rbxg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.05 150)" />
          <stop offset="100%" stopColor="oklch(0.7 0.21 155)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#rbxg)"
        d="M16 2 4 8v16l12 6 12-6V8L16 2Zm-3.2 9.6h5.6c2.2 0 3.6 1.4 3.6 3.4 0 1.5-.8 2.6-2.1 3.1l2.4 3.9h-2.9l-2.1-3.5h-2.1v3.5h-2.4v-10.4Zm2.4 2.1v2.7h2.9c1 0 1.6-.5 1.6-1.35s-.6-1.35-1.6-1.35h-2.9Z"
      />
    </svg>
  );
}

function RobuxIconSolid({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16 2 4 8v16l12 6 12-6V8L16 2Zm-3.2 9.6h5.6c2.2 0 3.6 1.4 3.6 3.4 0 1.5-.8 2.6-2.1 3.1l2.4 3.9h-2.9l-2.1-3.5h-2.1v3.5h-2.4v-10.4Zm2.4 2.1v2.7h2.9c1 0 1.6-.5 1.6-1.35s-.6-1.35-1.6-1.35h-2.9Z" />
    </svg>
  );
}

type RobloxProfile = {
  found: boolean;
  id?: number;
  name?: string;
  displayName?: string;
  avatarUrl?: string | null;
};

function Index() {
  const lookup = useServerFn(lookupRobloxUser);
  const [balance, setBalance] = useState(120_000_000);
  const [username, setUsername] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<Gift[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profile, setProfile] = useState<RobloxProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const canOpen =
    username.trim().length > 0 && selected !== null && selected <= balance && !sending;

  const openConfirm = async () => {
    if (!canOpen || selected === null) return;
    setConfirmOpen(true);
    setProfile(null);
    setLookupError(null);
    setLoadingProfile(true);
    try {
      const res = (await lookup({ data: { username: username.trim() } })) as RobloxProfile;
      setProfile(res);
      if (!res.found) setLookupError("No Roblox user with that name.");
    } catch {
      setLookupError("Could not reach Roblox. Try again.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeConfirm = () => {
    if (sending) return;
    setConfirmOpen(false);
  };

  const handleSend = () => {
    if (selected === null || !profile?.found) return;
    setSending(true);
    setTimeout(() => {
      setBalance((b) => b - selected);
      const gift: Gift = {
        id: Date.now(),
        username: profile.name ?? username.trim(),
        amount: selected,
        at: new Date().toLocaleTimeString(),
      };
      setHistory((h) => [gift, ...h].slice(0, 8));
      setToast(`Sent R$ ${fmt(selected)} to @${gift.username}`);
      setSending(false);
      setSelected(null);
      setUsername("");
      setProfile(null);
      setConfirmOpen(false);
      setTimeout(() => setToast(null), 2800);
    }, 700);
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-xl bg-background/70">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative grid place-items-center h-10 w-10 rounded-xl bg-foreground text-background">
              <RobuxIconSolid className="h-6 w-6" />
              <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary shadow-[var(--shadow-glow)]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black tracking-tight leading-none">
                ROBUX<span className="text-primary">.gift</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                Simulated · For fun only
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Balance + Send */}
        <section className="space-y-6">
          <div
            className="relative overflow-hidden rounded-3xl p-7 shadow-[var(--shadow-card),var(--shadow-inner-glow)] border border-white/10"
            style={{ background: "var(--gradient-robux)" }}
          >
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/20 blur-2xl" />
            <RobuxIconSolid className="absolute right-6 top-6 h-32 w-32 text-black/10" />

            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
                Your balance
              </p>
              <div className="mt-3 flex items-center gap-2.5 text-primary-foreground">
                <RobuxIconSolid className="h-9 w-9 drop-shadow" />
                <span className="font-display text-5xl sm:text-6xl font-black tracking-tight tabular-nums leading-none">
                  {fmt(balance)}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-black/25 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                  PREMIUM
                </span>
                <span className="text-xs text-primary-foreground/80">
                  Robux available to gift
                </span>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl border border-border p-6 shadow-[var(--shadow-card),var(--shadow-inner-glow)]"
            style={{ background: "var(--gradient-surface)" }}
          >
            <h2 className="text-base font-semibold mb-3">Recipient</h2>
            <div className="flex items-center rounded-xl border border-border bg-input/60 focus-within:ring-2 focus-within:ring-ring transition">
              <span className="pl-4 text-muted-foreground">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="username"
                className="w-full bg-transparent px-2 py-3 outline-none placeholder:text-muted-foreground"
                maxLength={32}
              />
            </div>

            <h2 className="text-base font-semibold mt-6 mb-3">Pick an amount</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMOUNTS.map((amt) => {
                const active = selected === amt;
                const tooMuch = amt > balance;
                return (
                  <button
                    key={amt}
                    onClick={() => setSelected(amt)}
                    disabled={tooMuch}
                    className={[
                      "group relative rounded-xl border px-3 py-3 text-left transition",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      active
                        ? "border-primary bg-primary/15 shadow-[var(--shadow-glow)]"
                        : "border-border bg-card hover:border-primary/60 hover:bg-accent",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-1.5 text-primary">
                      <RobuxIcon className="h-4 w-4" />
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {fmt(amt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {amt >= 1_000_000 ? "Whale tier" : amt >= 100_000 ? "Generous" : "Friendly"}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={openConfirm}
              disabled={!canOpen}
              className={[
                "mt-6 w-full rounded-xl py-3.5 font-semibold transition",
                "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]",
                "disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]",
              ].join(" ")}
            >
              {selected
                ? `Send R$ ${fmt(selected)}${username ? ` to @${username}` : ""}`
                : "Select an amount"}
            </button>
          </div>
        </section>

        {/* History */}
        <aside
          className="rounded-2xl border border-border p-6 shadow-[var(--shadow-card)] h-fit"
          style={{ background: "var(--gradient-surface)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent gifts</h2>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center border border-dashed border-border rounded-xl">
              No gifts sent yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">@{g.username}</p>
                    <p className="text-[11px] text-muted-foreground">{g.at}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold tabular-nums">
                    <RobuxIcon className="h-4 w-4" />
                    {fmt(g.amount)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-full border border-primary/40 bg-card px-5 py-3 shadow-[var(--shadow-glow)] flex items-center gap-2">
            <RobuxIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={closeConfirm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border p-6 shadow-[var(--shadow-card)] animate-in zoom-in-95"
            style={{ background: "var(--gradient-surface)" }}
          >
            <h3 className="text-lg font-bold text-center">Confirm gift</h3>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Are you sure you want to send
            </p>
            <div className="my-3 flex items-center justify-center gap-2 text-primary">
              <RobuxIcon className="h-7 w-7" />
              <span className="text-3xl font-extrabold tabular-nums text-foreground">
                {selected !== null ? fmt(selected) : ""}
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground">to</p>

            <div className="mt-4 rounded-xl border border-border bg-card/60 p-4 min-h-[112px] flex items-center gap-4">
              {loadingProfile ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  </div>
                </>
              ) : profile?.found ? (
                <>
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="h-16 w-16 rounded-full bg-muted object-cover border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted grid place-items-center text-xl font-bold">
                      {profile.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{profile.displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">@{profile.name}</p>
                    <a
                      href={`https://www.roblox.com/users/${profile.id}/profile`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View profile ↗
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">
                  {lookupError ?? "User not found."}
                </p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={closeConfirm}
                disabled={sending}
                className="rounded-xl border border-border bg-secondary px-4 py-3 font-medium hover:bg-accent transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || loadingProfile || !profile?.found}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-3 font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-glow)]"
              >
                {sending ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
