"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import {
  COMPANY_LINKS_REQUEST_EVENT,
  type CompanyLinksRequestDetail,
} from "@/lib/company-links-events";
import type { Company } from "@/types/company";

const TAVILY_KEY = "tavily";

type CompanyLink = {
  id: string;
  title: string;
  url: string;
  content: string;
  score: number;
  favicon?: string;
  publishedDate?: string;
};

type CompanyLinksResponse = {
  answer?: string | null;
  links?: CompanyLink[];
  error?: string;
};

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; markdown: string; pending?: boolean };

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function userPromptFor(company: Company) {
  const bits = [
    company.name,
    company.industry,
    company.city,
    company.website ? safeHost(company.website) : null,
  ].filter(Boolean);
  return `Get links for **${company.name}**\n${bits.slice(1).join(" · ")}`;
}

function linksToMarkdown(answer: string | null | undefined, links: CompanyLink[]) {
  const parts: string[] = [];
  if (answer?.trim()) parts.push(answer.trim());

  if (links.length > 0) {
    parts.push(
      links
        .map((link) => {
          const title = link.title || safeHost(link.url);
          const snippet = link.content ? `\n  ${link.content}` : "";
          return `- [${title}](${link.url})${snippet}`;
        })
        .join("\n"),
    );
  } else if (!answer?.trim()) {
    parts.push("No important links found for this company.");
  }

  return parts.join("\n\n");
}

export default function BotModal() {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const keyInputId = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  const apiKeyRef = useRef(apiKey);
  const loadingRef = useRef(loading);

  useEffect(() => {
    const stored = localStorage.getItem(TAVILY_KEY);
    if (stored?.trim()) setApiKey(stored.trim());
  }, []);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    async function handleRequest(event: Event) {
      const detail = (event as CustomEvent<CompanyLinksRequestDetail>).detail;
      const company = detail?.company;
      if (!company?.name) return;

      setOpen(true);

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        text: userPromptFor(company),
      };
      setMessages((prev) => [...prev, userMessage]);

      const key = apiKeyRef.current;
      if (!key) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            markdown:
              "Add your Tavily API key below, then click **Get Links** again on the company pin.",
          },
        ]);
        return;
      }

      if (loadingRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            markdown: "Still fetching the previous request — try again in a moment.",
          },
        ]);
        return;
      }

      const pendingId = nextId();
      setLoading(true);
      setMessages((prev) => [
        ...prev,
        { id: pendingId, role: "assistant", markdown: "Searching…", pending: true },
      ]);

      try {
        const response = await fetch("/api/companylinks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: key,
            company: {
              id: company.id,
              name: company.name,
              description: company.description,
              industry: company.industry,
              city: company.city,
              website: company.website,
              logo: company.logo,
              latitude: company.latitude,
              longitude: company.longitude,
            },
          }),
        });

        const data = (await response.json()) as CompanyLinksResponse;
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch company links");
        }

        const markdown = linksToMarkdown(data.answer, data.links ?? []);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? { id: pendingId, role: "assistant", markdown }
              : message,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((item) =>
            item.id === pendingId
              ? { id: pendingId, role: "assistant", markdown: `**Error:** ${message}` }
              : item,
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    window.addEventListener(COMPANY_LINKS_REQUEST_EVENT, handleRequest);
    return () => window.removeEventListener(COMPANY_LINKS_REQUEST_EVENT, handleRequest);
  }, []);

  function saveApiKey(event: FormEvent) {
    event.preventDefault();
    const next = keyDraft.trim();
    if (!next) return;
    localStorage.setItem(TAVILY_KEY, next);
    setApiKey(next);
    setKeyDraft("");
  }

  function clearApiKey() {
    localStorage.removeItem(TAVILY_KEY);
    setApiKey("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-[30%] right-4 z-30 inline-flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-white/90 px-3.5 py-2.5 text-[13px] font-medium text-[#122033] shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md transition hover:bg-white"
        aria-label="Open map assistant"
      >
        <span
          className="grid h-5 w-5 place-items-center rounded-md bg-[#6fad3a]/15 text-[11px] font-semibold text-[#3d7a2f]"
          aria-hidden
        >
          ?
        </span>
        Ask
        {messages.length > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-md bg-[#122033] px-1 text-[10px] font-semibold text-white">
            {messages.length}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <aside
      className="fixed top-[20%] right-4 z-30 flex max-h-[min(70vh,560px)] w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-900/10 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md"
      aria-label="Map assistant"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-900/8 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-semibold tracking-widest text-[#5b7a3a] uppercase">
            Assistant
          </p>
          <h2 className="m-0 mt-1 text-[15px] leading-tight font-semibold text-[#122033]">
            Company links
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#5b6775] transition hover:bg-slate-900/5 hover:text-[#122033]"
          aria-label="Minimize assistant"
        >
          <span className="block h-0.5 w-3 rounded-full bg-current" aria-hidden />
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {!apiKey && messages.length === 0 ? (
          <ol className="m-0 list-decimal space-y-1.5 rounded-xl bg-slate-900/[0.03] px-3 py-2.5 pl-7 text-[13px] leading-relaxed text-[#344054]">
            <li>
              Go to{" "}
              <Link
                href="https://app.tavily.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#3d7a2f] no-underline hover:underline"
              >
                app.tavily.com
              </Link>
            </li>
            <li>Copy your API key and paste it below</li>
            <li>
              Open a company pin and click <strong>Get Links</strong>
            </li>
          </ol>
        ) : null}

        {apiKey && messages.length === 0 ? (
          <p className="m-0 rounded-xl bg-slate-900/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-[#5b6775]">
            Open a company on the map and click <strong>Get Links</strong>. Chat stays for this
            page session.
          </p>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-br-md bg-[#122033] px-3 py-2 text-[13px] leading-relaxed text-white [&_p]:m-0 [&_strong]:font-semibold">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-start">
              <div
                className={`max-w-[95%] rounded-2xl rounded-bl-md px-3 py-2 text-[13px] leading-relaxed text-[#344054] [&_a]:font-medium [&_a]:text-[#3d7a2f] [&_a]:no-underline hover:[&_a]:underline [&_li]:my-1 [&_ol]:m-0 [&_ol]:pl-4 [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:font-semibold [&_ul]:m-0 [&_ul]:pl-4 ${
                  message.pending
                    ? "bg-slate-900/[0.04] text-[#5b6775]"
                    : "bg-slate-900/[0.05]"
                }`}
              >
                <ReactMarkdown>{message.markdown}</ReactMarkdown>
              </div>
            </div>
          ),
        )}
      </div>

      {!apiKey ? (
        <form className="border-t border-slate-900/8 p-3" onSubmit={saveApiKey}>
          <label htmlFor={keyInputId} className="sr-only">
            Enter the API key
          </label>
          <div className="flex items-end gap-2 rounded-xl border border-slate-900/10 bg-white px-2.5 py-2 shadow-sm focus-within:border-[#6fad3a]/60">
            <input
              id={keyInputId}
              type="password"
              autoComplete="off"
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              placeholder="Tavily API key"
              className="min-h-[22px] w-full bg-transparent text-[13px] leading-snug text-[#122033] outline-none placeholder:text-[#98a2b3]"
            />
            <button
              type="submit"
              disabled={!keyDraft.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#6fad3a] text-white transition enabled:hover:bg-[#5c962e] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Save API key"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 7h10M7.5 2.5 12 7l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t border-slate-900/8 px-4 py-2.5">
          <p className="m-0 text-[11px] text-[#5b6775]">
            {loading ? "Searching…" : "Key saved locally"}
          </p>
          <button
            type="button"
            onClick={clearApiKey}
            className="text-[11px] text-[#5b6775] underline-offset-2 hover:text-[#122033] hover:underline"
          >
            Change key
          </button>
        </div>
      )}
    </aside>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
