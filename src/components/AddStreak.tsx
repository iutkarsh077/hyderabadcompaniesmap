"use client";

import { useEffect, useState } from "react";

const AddStreak = ({ onAdd }: { onAdd: (username: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedUsername = username.trim();

        if (!trimmedUsername) return;

        onAdd(trimmedUsername);

        setUsername("");
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group relative w-full overflow-hidden rounded-2xl border border-[#26394b] bg-[#122033] px-5 py-4 text-left text-white shadow-[0_10px_24px_rgba(18,32,51,0.2)] transition hover:-translate-y-0.5 hover:bg-[#172b40] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
                <span className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-orange-500/20 transition group-hover:scale-125" />
                <span className="relative flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-2xl shadow-[0_5px_0_#b93816]">
                        🔥
                    </span>
                    <span>
                        <span className="block text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                            Join Github Streak
                        </span>
                       </span>
                    <span className="ml-auto text-xl text-orange-300 transition group-hover:translate-x-1">
                        →
                    </span>
                </span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1624]/75 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setOpen(false);
                    }}
                    role="presentation"
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#334b62] bg-[#122033] text-white shadow-[0_24px_70px_rgba(11,22,36,0.45)]"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-streak-title"
                    >
                        <div className="relative border-b border-white/10 bg-[#172b40] px-6 pb-6 pt-7">
                            <div className="absolute -right-5 -top-10 h-28 w-28 rounded-full bg-orange-500/15" />
                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                                        New challenger
                                    </p>
                                    <h2 id="add-streak-title" className="text-2xl font-bold tracking-tight">
                                        Add a GitHub player
                                    </h2>
                                    <p className="mt-2 text-sm text-[#a9bacb]">
                                        Start their streak at the bottom of the leaderboard.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    aria-label="Close dialog"
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-lg text-[#a9bacb] transition hover:border-orange-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="relative mt-5 flex items-center gap-3 text-xs font-semibold text-[#a9bacb]">
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#0c1a2a]">
                                    <span className="block h-full w-1/3 rounded-full bg-orange-500" />
                                </span>
                                <span className="shrink-0 text-orange-300">+100 XP</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label htmlFor="github-username" className="mb-2 block text-sm font-semibold text-[#dbe6ef]">
                                    GitHub username
                                </label>
                                <input
                                    id="github-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. octocat"
                                    autoFocus
                                    className="w-full rounded-xl border border-[#3b536a] bg-[#0c1a2a] px-4 py-3 text-white outline-none transition placeholder:text-[#71859a] focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!username.trim()}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-bold text-white shadow-[0_4px_0_#b93816] transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-[#122033] active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                            >
                                <span>Enter the leaderboard</span>
                                <span aria-hidden="true">→</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddStreak;