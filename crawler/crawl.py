"""
Offline hiring crawl. Not started by Next.js.

  python -m pip install -r crawler/requirements.txt
  python crawler/crawl.py

Does not guess /careers /jobs on every host (that was the 404 storm).
Writes at most 2 roles per company. Titles are the wording from the ATS JSON
or the visible heading/link text on the career page (whitespace only).

Optional env (repo .env / .env.local):
  CRAWL_LIMIT=80          max company websites to visit (0 = all)
  CRAWL_DELAY_SECONDS=1.5 pause between companies
"""

from __future__ import annotations

import hashlib
import html as html_lib
import json
import logging
import os
import random
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from scrapling.fetchers import Fetcher

logging.getLogger("scrapling").setLevel(logging.WARNING)
logging.getLogger("scrapling.core.utils").setLevel(logging.WARNING)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local", override=True)

COLLECTIONS = (
    ("companies", "Hyderabad"),
    ("bengaluru_listings", "Bengaluru"),
    ("gurugram_noida_delhi_listings", "Delhi NCR"),
    ("pune_listings", "Pune"),
    ("ahmedabad_listings", "Ahmedabad"),
)

CITY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Hyderabad": ("hyderabad", "secunderabad", "hitec city", "gachibowli"),
    "Bengaluru": ("bengaluru", "bangalore", "whitefield", "koramangala"),
    "Delhi NCR": ("delhi", "new delhi", "gurugram", "gurgaon", "noida", "ncr"),
    "Pune": ("pune", "hinjewadi"),
    "Ahmedabad": ("ahmedabad", "gandhinagar", "gift city"),
}

GREENHOUSE_RE = re.compile(
    r"(?:boards(?:-api)?|job-boards)\.greenhouse\.io/([a-zA-Z0-9_-]+)",
    re.I,
)
GREENHOUSE_FOR_RE = re.compile(r"greenhouse\.io/[^\"'\s]*[?&]for=([a-zA-Z0-9_-]+)", re.I)
LEVER_RE = re.compile(r"jobs\.lever\.co/([a-zA-Z0-9_-]+)", re.I)
ASHBY_RE = re.compile(r"(?:jobs|app)\.ashbyhq\.com/([a-zA-Z0-9_-]+)", re.I)
WORKABLE_RE = re.compile(r"apply\.workable\.com/([a-zA-Z0-9_-]+)", re.I)
SMART_RE = re.compile(r"jobs\.smartrecruiters\.com/([a-zA-Z0-9_-]+)", re.I)
CAREER_HREF_RE = re.compile(
    r"(career|jobs|hiring|join[-_]?us|work[-_]?with|openings)",
    re.I,
)
SKIP_CAREER_HREF_RE = re.compile(
    r"(mailto:|javascript:|linkedin\.com|instagram\.com|facebook\.com|"
    r"twitter\.com|x\.com|\.(?:jpg|jpeg|png|gif|webp|svg|pdf)(?:\?|$))",
    re.I,
)
HEADING_RE = re.compile(r"<h[2-4][^>]*>(.*?)</h[2-4]>", re.I | re.S)
ANCHOR_RE = re.compile(r"""<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)</a>""", re.I | re.S)
ANCHOR_LABELED_RE = re.compile(
    r"""<a\b[^>]*(?:title|aria-label)\s*=\s*["']([^"']+)["'][^>]*href\s*=\s*["']([^"']+)["']"""
    r"""|<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*(?:title|aria-label)\s*=\s*["']([^"']+)["']""",
    re.I,
)
ROLE_RE = re.compile(
    r"(engineer|developer|designer|manager|intern|analyst|consultant|specialist|"
    r"executive|scientist|architect|recruiter|sde|full.?stack|backend|frontend|"
    r"devops|data scientist|product owner|sales|marketing|accountant)",
    re.I,
)
JOB_PATH_RE = re.compile(r"/(jobs?|careers?|openings?|positions?|vacancies|hiring)/", re.I)
SKIP_TITLE_RE = re.compile(
    r"^(welcome\b|why\b|how\b|our\b|about\b|what\b|when\b|work for\b)|"
    r"youtube|patients|google apps|search for|instagram|facebook|"
    r"\bchoose\b|\blink\b",
    re.I,
)
SKIP_SITE_HOSTS = (
    "google.com",
    "google.co.in",
    "youtube.com",
    "youtu.be",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "wikipedia.org",
)
ATS_HOST_MARKERS = (
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "workable.com",
    "smartrecruiters.com",
    "myworkdayjobs.com",
)
GENERIC_TITLES = {
    "careers",
    "career",
    "jobs",
    "job",
    "join us",
    "join-us",
    "openings",
    "current openings",
    "view openings",
    "we're hiring",
    "we are hiring",
    "work with us",
    "apply",
    "apply now",
    "read more",
    "learn more",
    "home",
    "about",
    "contact",
    "see all",
    "view all",
    "welcome to ahex technologies",
    "why engineers choose ahex",
    "international patients",
    "google apps",
    "search for images",
    "tanla youtube",
    "work for tanla",
    "care hospitals youtube link",
}

USER_AGENT = "HyderabadCompaniesMap hiring crawl (local operator)"
MAX_JOBS_PER_COMPANY = 2


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


def fetch_json(url: str) -> object | None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def page_html(page: object) -> str:
    body = getattr(page, "body", None)
    encoding = getattr(page, "encoding", None) or "utf-8"
    if isinstance(body, bytes) and body:
        return body.decode(encoding, errors="ignore")
    if isinstance(body, str) and body.strip():
        return body
    html_content = getattr(page, "html_content", None)
    if html_content:
        return str(html_content)
    return ""


def find_ats(html: str) -> dict[str, str]:
    found: dict[str, str] = {}
    greenhouse = GREENHOUSE_FOR_RE.search(html) or GREENHOUSE_RE.search(html)
    if greenhouse:
        found["greenhouse"] = greenhouse.group(1)
    lever = LEVER_RE.search(html)
    if lever:
        found["lever"] = lever.group(1)
    ashby = ASHBY_RE.search(html)
    if ashby:
        found["ashby"] = ashby.group(1)
    workable = WORKABLE_RE.search(html)
    if workable:
        found["workable"] = workable.group(1)
    smart = SMART_RE.search(html)
    if smart:
        found["smartrecruiters"] = smart.group(1)
    return found


def career_urls(website: str, html: str) -> list[str]:
    base = website if "://" in website else f"https://{website}"
    home = urllib.parse.urljoin(base, "/").rstrip("/")
    urls: list[str] = []
    seen: set[str] = {home.lower(), website.rstrip("/").lower()}

    for match in re.finditer(r"""href\s*=\s*["']([^"']+)["']""", html, re.I):
        href = match.group(1).strip()
        if not CAREER_HREF_RE.search(href) or SKIP_CAREER_HREF_RE.search(href):
            continue
        full = urllib.parse.urljoin(base, href).split("#")[0].rstrip("/")
        key = full.lower()
        if not full or key in seen:
            continue
        seen.add(key)
        urls.append(full)
        if len(urls) >= 2:
            break
    return urls


def match_city(location: str, fallback: str) -> str | None:
    text = location.lower()
    for city, keywords in CITY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            return city
    if "remote" in text or "india" in text or not text.strip():
        return fallback
    return None


def greenhouse_jobs(token: str) -> list[dict[str, str]]:
    payload = fetch_json(f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs")
    if not isinstance(payload, dict):
        return []
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        return []
    rows: list[dict[str, str]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        job_id = job.get("id")
        title = job.get("title")
        url = job.get("absolute_url")
        location_obj = job.get("location")
        location = ""
        if isinstance(location_obj, dict):
            location = str(location_obj.get("name") or "")
        if job_id is None or not title or not url:
            continue
        rows.append(
            {
                "external_id": str(job_id),
                "title": str(title),
                "url": str(url),
                "location": location,
            }
        )
    return rows


def lever_jobs(token: str) -> list[dict[str, str]]:
    payload = fetch_json(f"https://api.lever.co/v0/postings/{token}?mode=json")
    if not isinstance(payload, list):
        return []
    rows: list[dict[str, str]] = []
    for job in payload:
        if not isinstance(job, dict):
            continue
        job_id = job.get("id")
        title = job.get("text")
        url = job.get("hostedUrl") or job.get("applyUrl")
        categories = job.get("categories")
        location = ""
        if isinstance(categories, dict):
            location = str(categories.get("location") or "")
        if job_id is None or not title or not url:
            continue
        rows.append(
            {
                "external_id": str(job_id),
                "title": str(title),
                "url": str(url),
                "location": location,
            }
        )
    return rows


def ashby_jobs(token: str) -> list[dict[str, str]]:
    payload = fetch_json(f"https://api.ashbyhq.com/posting-api/job-board/{token}")
    if not isinstance(payload, dict):
        return []
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        return []
    rows: list[dict[str, str]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        job_id = job.get("id")
        title = job.get("title")
        url = job.get("jobUrl") or job.get("applyUrl")
        location = str(job.get("location") or "")
        if job_id is None or not title or not url:
            continue
        rows.append(
            {
                "external_id": str(job_id),
                "title": str(title),
                "url": str(url),
                "location": location,
            }
        )
    return rows


def workable_jobs(token: str) -> list[dict[str, str]]:
    payload = fetch_json(f"https://apply.workable.com/api/v1/widget/accounts/{token}")
    if not isinstance(payload, dict):
        return []
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        return []
    rows: list[dict[str, str]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        job_id = job.get("shortcode") or job.get("id")
        title = job.get("title")
        url = job.get("url") or job.get("application_url")
        location_obj = job.get("location")
        location = ""
        if isinstance(location_obj, dict):
            location = " ".join(
                str(location_obj.get(key) or "") for key in ("city", "region", "country")
            ).strip()
        elif isinstance(location_obj, str):
            location = location_obj
        if job_id is None or not title or not url:
            continue
        rows.append(
            {
                "external_id": str(job_id),
                "title": str(title),
                "url": str(url),
                "location": location,
            }
        )
    return rows


def smartrecruiters_jobs(token: str) -> list[dict[str, str]]:
    payload = fetch_json(f"https://api.smartrecruiters.com/v1/companies/{token}/postings")
    if not isinstance(payload, dict):
        return []
    jobs = payload.get("content")
    if not isinstance(jobs, list):
        return []
    rows: list[dict[str, str]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        job_id = job.get("id")
        title = job.get("name")
        url = job.get("postingUrl") or job.get("applyUrl")
        location_obj = job.get("location")
        location = ""
        if isinstance(location_obj, dict):
            location = " ".join(
                str(location_obj.get(key) or "") for key in ("city", "region", "country")
            ).strip()
        if job_id is None or not title or not url:
            continue
        rows.append(
            {
                "external_id": str(job_id),
                "title": str(title),
                "url": str(url),
                "location": location,
            }
        )
    return rows


def page_title_text(inner: str) -> str:
    text = html_lib.unescape(re.sub(r"<[^>]+>", " ", inner))
    return re.sub(r"\s+", " ", text).strip(" \t\n\r-|•·")


def host_of(url: str) -> str:
    full = url if "://" in url else f"https://{url}"
    host = (urllib.parse.urlparse(full).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def is_skipped_site(url: str) -> bool:
    host = host_of(url)
    return any(host == skip or host.endswith("." + skip) for skip in SKIP_SITE_HOSTS)


def url_ok_for_company(job_url: str, company_website: str) -> bool:
    if is_skipped_site(job_url):
        return False
    job_host = host_of(job_url)
    company_host = host_of(company_website)
    if not job_host or not company_host:
        return False
    if any(marker in job_host for marker in ATS_HOST_MARKERS):
        return True
    return (
        job_host == company_host
        or job_host.endswith("." + company_host)
        or company_host.endswith("." + job_host)
    )


def looks_like_job_title(title: str) -> bool:
    cleaned = page_title_text(title)
    if len(cleaned) < 8 or len(cleaned) > 70:
        return False
    if cleaned.casefold() in GENERIC_TITLES:
        return False
    if SKIP_TITLE_RE.search(cleaned):
        return False
    if "?" in cleaned:
        return False
    words = cleaned.split()
    if len(words) < 2 or len(words) > 8:
        return False
    return bool(ROLE_RE.search(cleaned))


def html_jobs(html: str, page_url: str, company_website: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    seen_titles: set[str] = set()
    seen_urls: set[str] = set()

    def add(title: str, url: str) -> bool:
        cleaned = page_title_text(title)
        if not looks_like_job_title(cleaned):
            return True
        if not url_ok_for_company(url, company_website):
            return True
        title_key = cleaned.casefold()
        url_key = url.split("#")[0].rstrip("/").lower()
        if title_key in seen_titles or url_key in seen_urls:
            return True
        seen_titles.add(title_key)
        seen_urls.add(url_key)
        external_id = hashlib.sha1(f"{url_key}|{title_key}".encode("utf-8")).hexdigest()[:16]
        rows.append(
            {
                "external_id": external_id,
                "title": cleaned,
                "url": url.split("#")[0],
                "location": "",
            }
        )
        return len(rows) < MAX_JOBS_PER_COMPANY

    for heading in HEADING_RE.findall(html):
        if not add(page_title_text(heading), page_url):
            return rows

    for match in ANCHOR_LABELED_RE.finditer(html):
        label_a, href_a, href_b, label_b = match.groups()
        label = label_a or label_b or ""
        href = href_a or href_b or ""
        full = urllib.parse.urljoin(page_url, href)
        if SKIP_CAREER_HREF_RE.search(full):
            continue
        if not add(label, full):
            return rows

    for href, inner in ANCHOR_RE.findall(html):
        full = urllib.parse.urljoin(page_url, href)
        if SKIP_CAREER_HREF_RE.search(full):
            continue
        if not add(page_title_text(inner), full):
            return rows

    return rows


def load_companies(db) -> list[dict[str, str]]:
    companies: list[dict[str, str]] = []
    seen: set[str] = set()
    for collection_name, map_city in COLLECTIONS:
        cursor = db[collection_name].find(
            {"website": {"$exists": True, "$nin": [None, ""]}},
            {"id": 1, "name": 1, "website": 1},
        )
        for doc in cursor:
            website = str(doc.get("website") or "").strip()
            company_id = str(doc.get("id") or "")
            name = str(doc.get("name") or "").strip()
            if not website or not company_id or not name:
                continue
            key = website.rstrip("/").lower()
            if key in seen:
                continue
            seen.add(key)
            companies.append(
                {
                    "id": company_id,
                    "name": name,
                    "website": website,
                    "map_city": map_city,
                }
            )
    return companies


def sample_companies(companies: list[dict[str, str]], limit: int, seed: str) -> list[dict[str, str]]:
    by_city: dict[str, list[dict[str, str]]] = {city: [] for city in CITY_KEYWORDS}
    for company in companies:
        by_city.setdefault(company["map_city"], []).append(company)

    rng = random.Random(seed)
    for bucket in by_city.values():
        rng.shuffle(bucket)

    if limit <= 0:
        chosen: list[dict[str, str]] = []
        for bucket in by_city.values():
            chosen.extend(bucket)
        return chosen

    chosen = []
    index = 0
    while len(chosen) < limit:
        progressed = False
        for city in CITY_KEYWORDS:
            bucket = by_city.get(city) or []
            if index < len(bucket):
                chosen.append(bucket[index])
                progressed = True
                if len(chosen) >= limit:
                    break
        if not progressed:
            break
        index += 1
    return chosen


def fetch_homepage(website: str) -> object | None:
    fetch = getattr(Fetcher, "get", None) or getattr(Fetcher, "fetch", None)
    if fetch is None:
        raise RuntimeError("Scrapling Fetcher has neither get nor fetch")
    try:
        return fetch(website, stealthy_headers=True)
    except TypeError:
        try:
            return fetch(website)
        except Exception:
            return None
    except Exception:
        return None


def fetch_ok(url: str) -> object | None:
    page = fetch_homepage(url)
    if page is None:
        return None
    status = getattr(page, "status", 0)
    if status != 200:
        return None
    html = page_html(page)
    if not html.strip():
        return None
    return page


def jobs_for_ats(ats: dict[str, str]) -> list[tuple[str, dict[str, str]]]:
    raw_jobs: list[tuple[str, dict[str, str]]] = []
    if "greenhouse" in ats:
        for job in greenhouse_jobs(ats["greenhouse"]):
            raw_jobs.append(("greenhouse", job))
    if "lever" in ats:
        for job in lever_jobs(ats["lever"]):
            raw_jobs.append(("lever", job))
    if "ashby" in ats:
        for job in ashby_jobs(ats["ashby"]):
            raw_jobs.append(("ashby", job))
    if "workable" in ats:
        for job in workable_jobs(ats["workable"]):
            raw_jobs.append(("workable", job))
    if "smartrecruiters" in ats:
        for job in smartrecruiters_jobs(ats["smartrecruiters"]):
            raw_jobs.append(("smartrecruiters", job))
    return raw_jobs


def collect_jobs(website: str) -> tuple[list[tuple[str, dict[str, str]]], str]:
    if is_skipped_site(website):
        return [], ""
    page = fetch_ok(website)
    if page is None:
        return [], ""
    html = page_html(page)
    ats = find_ats(html)
    raw = jobs_for_ats(ats)
    if raw:
        return raw, ",".join(ats)

    for url in career_urls(website, html):
        if not url_ok_for_company(url, website):
            continue
        time.sleep(0.35)
        career = fetch_ok(url)
        if career is None:
            continue
        career_html = page_html(career)
        if abs(len(career_html) - len(html)) < 80:
            continue
        ats = find_ats(career_html)
        raw = jobs_for_ats(ats)
        if raw:
            return raw, ",".join(ats)
        parsed = html_jobs(career_html, url, website)
        if parsed:
            return [("careers", job) for job in parsed], "careers"

    return [], ""


def main() -> int:
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("MONGODB_URI is missing", file=sys.stderr)
        return 1

    limit = env_int("CRAWL_LIMIT", 80)
    delay = env_float("CRAWL_DELAY_SECONDS", 1.5)
    run_started = datetime.now(timezone.utc)

    client = MongoClient(uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["hyderabad-map"]

    hiring = db["hiring_jobs"]
    hiring.create_index("id", unique=True)
    hiring.create_index("companyId")
    junk = hiring.delete_many(
        {
            "$or": [
                {
                    "title": {
                        "$regex": (
                            r"welcome to|why |youtube|patients|google apps|"
                            r"search for|work for |international patients"
                        ),
                        "$options": "i",
                    }
                },
                {"url": {"$regex": r"youtube\.com|google\.com|youtu\.be", "$options": "i"}},
            ]
        }
    )
    if junk.deleted_count:
        print(f"Removed {junk.deleted_count} non-job rows left from earlier crawls")

    companies = sample_companies(load_companies(db), limit, run_started.date().isoformat())
    print(f"Using database `{db.name}`. Visiting {len(companies)} company websites…")
    print("Only real career links are followed (no guessed /careers /jobs /join-us paths).")

    operations: list[UpdateOne] = []
    processed_ids: list[str] = []
    source_hits = 0
    no_city = 0

    for index, company in enumerate(companies, start=1):
        processed_ids.append(company["id"])
        if index > 1 and delay > 0:
            time.sleep(delay)

        raw_jobs, source_label = collect_jobs(company["website"])
        if not raw_jobs:
            continue
        source_hits += 1

        kept = 0
        for source, job in raw_jobs:
            if kept >= MAX_JOBS_PER_COMPANY:
                break
            city = match_city(job["location"], company["map_city"])
            if not city:
                continue
            title = page_title_text(job["title"])
            if not title or (source == "careers" and not looks_like_job_title(title)):
                continue
            if not url_ok_for_company(job["url"], company["website"]):
                continue
            job_id = f"{source}:{job['external_id']}"
            doc = {
                "id": job_id,
                "source": source,
                "companyName": company["name"],
                "companyId": company["id"],
                "title": title,
                "city": city,
                "location": job["location"] or city,
                "url": job["url"],
                "crawledAt": run_started,
            }
            operations.append(UpdateOne({"id": job_id}, {"$set": doc}, upsert=True))
            kept += 1

        if kept:
            print(f"  {company['name']}: {kept} roles ({source_label})")
        else:
            no_city += 1
            print(
                f"  {company['name']}: found {len(raw_jobs)} postings via {source_label} "
                "but none in map cities"
            )

    if operations:
        result = hiring.bulk_write(operations, ordered=False)
        print(
            f"Wrote to `{db.name}.hiring_jobs`: upserted {result.upserted_count} · "
            f"modified {result.modified_count} · {len(operations)} roles this run"
        )
    else:
        print(f"Wrote 0 rows to `{db.name}.hiring_jobs` (no matching roles this run).")

    if processed_ids:
        prune = hiring.delete_many(
            {
                "companyId": {"$in": processed_ids},
                "crawledAt": {"$lt": run_started},
            }
        )
        print(f"Removed {prune.deleted_count} stale roles for companies visited this run")

    print(
        f"Summary: visited {len(companies)} · companies with roles {source_hits} · "
        f"wrong-city skips {no_city} · kept {len(operations)}"
    )
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
