"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";

type Submission = {
  _id: string;
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: number;
  longitude: number;
  website: string | null;
  logo: string | null;
  createdAt?: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-900/12 bg-white px-3.5 py-2.5 text-[14px] text-[#122033] outline-none transition placeholder:text-[#9aa3af] focus:border-[#6fad3a]/55 focus:ring-2 focus:ring-[#6fad3a]/20";

const labelClass = "block text-[12px] font-medium tracking-wide text-[#5b6775]";

export default function VerifyCompanyPanel() {
  const formId = useId();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [secret1, setSecret1] = useState("");
  const [secret2, setSecret2] = useState("");
  const [secret3, setSecret3] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setListError(null);
    const response = await fetch("/api/verify-company/submissions");
    if (response.status === 401) {
      setAuthed(false);
      setSubmissions([]);
      return false;
    }
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setListError(data?.error ?? "Could not load submissions");
      return false;
    }
    const data = (await response.json()) as { submissions: Submission[] };
    setSubmissions(data.submissions);
    setAuthed(true);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadSubmissions();
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSubmissions]);

  async function onLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await fetch("/api/verify-company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret1, secret2, secret3 }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setLoginError(data?.error ?? "Login failed");
        return;
      }
      setSecret1("");
      setSecret2("");
      setSecret3("");
      await loadSubmissions();
    } finally {
      setLoginLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/verify-company/logout", { method: "POST" });
    setAuthed(false);
    setSubmissions([]);
    setNotice(null);
  }

  async function onPublish(submissionId: string) {
    setPublishingId(submissionId);
    setNotice(null);
    setListError(null);
    try {
      const response = await fetch("/api/verify-company/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        collection?: string;
        companyId?: string;
      } | null;
      if (!response.ok) {
        setListError(data?.error ?? "Publish failed");
        return;
      }
      setNotice(
        `Published ${data?.companyId ?? "company"} into ${data?.collection ?? "city collection"}.`,
      );
      setSubmissions((prev) => prev.filter((item) => item._id !== submissionId));
    } finally {
      setPublishingId(null);
    }
  }

  if (checking) {
    return <p className="m-0 text-[14px] text-[#5b6775]">Checking session…</p>;
  }

  if (!authed) {
    return (
      <form onSubmit={onLogin} className="mx-auto max-w-md space-y-5">
        <p className="m-0 text-[14px] leading-relaxed text-[#344054]">
          Enter the three secrets to review pending company submissions. This page is private —
          do not share the URL.
        </p>
        <div>
          <label className={labelClass} htmlFor={`${formId}-s1`}>
            Secret 1
          </label>
          <input
            id={`${formId}-s1`}
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={secret1}
            onChange={(e) => setSecret1(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-s2`}>
            Secret 2
          </label>
          <input
            id={`${formId}-s2`}
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={secret2}
            onChange={(e) => setSecret2(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${formId}-s3`}>
            Secret 3
          </label>
          <input
            id={`${formId}-s3`}
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={secret3}
            onChange={(e) => setSecret3(e.target.value)}
            required
          />
        </div>
        {loginError ? (
          <p className="m-0 rounded-xl border border-[#c45c26]/25 bg-[#c45c26]/8 px-3.5 py-2.5 text-[13px] text-[#8a3a14]">
            {loginError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loginLoading}
          className="inline-flex items-center justify-center rounded-[10px] bg-[#122033] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1a2d44] disabled:opacity-60"
        >
          {loginLoading ? "Checking…" : "Unlock"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-[#5b6775]">
          {submissions.length} pending submission{submissions.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="text-[13px] font-medium text-[#5b6775] underline-offset-2 hover:text-[#122033] hover:underline"
        >
          Lock
        </button>
      </div>

      {notice ? (
        <p className="m-0 rounded-xl border border-[#6fad3a]/30 bg-[#6fad3a]/10 px-3.5 py-2.5 text-[13px] text-[#2f5c24]">
          {notice}
        </p>
      ) : null}
      {listError ? (
        <p className="m-0 rounded-xl border border-[#c45c26]/25 bg-[#c45c26]/8 px-3.5 py-2.5 text-[13px] text-[#8a3a14]">
          {listError}
        </p>
      ) : null}

      {submissions.length === 0 ? (
        <p className="m-0 text-[14px] text-[#5b6775]">No pending companies to review.</p>
      ) : (
        <ul className="m-0 list-none space-y-4 p-0">
          {submissions.map((submission) => (
            <li
              key={submission._id}
              className="rounded-2xl border border-slate-900/10 bg-white/80 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="m-0 text-lg font-semibold text-[#122033]">{submission.name}</h2>
                  <p className="mt-1 m-0 text-[12px] text-[#5b6775]">
                    <span className="font-mono">{submission.id}</span>
                    {" · "}
                    {submission.city}
                    {" · "}
                    {submission.industry}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={publishingId === submission._id}
                  onClick={() => onPublish(submission._id)}
                  className="inline-flex shrink-0 items-center justify-center rounded-[10px] bg-[#6fad3a] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#5c962e] disabled:opacity-60"
                >
                  {publishingId === submission._id ? "Publishing…" : "Publish"}
                </button>
              </div>
              <p className="mt-3 m-0 text-[14px] leading-relaxed text-[#344054]">
                {submission.description}
              </p>
              <p className="mt-2 m-0 text-[12px] text-[#5b6775]">
                {submission.latitude}, {submission.longitude}
                {submission.website ? (
                  <>
                    {" · "}
                    <a
                      href={submission.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#3d7a2f] no-underline hover:underline"
                    >
                      Website
                    </a>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
