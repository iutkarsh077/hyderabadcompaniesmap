"""
Resume-based hiring crawler.

Replaces the old company-website/ATS crawler with:
    - Naukri
    - LinkedIn
    - Wellfound

Keeps the original database/city structure:
    - companies              -> Hyderabad
    - bengaluru_listings     -> Bengaluru
    - gurugram_noida_delhi_listings -> Delhi NCR
    - pune_listings          -> Pune
    - ahmedabad_listings     -> Ahmedabad

Jobs are written to:
    hiring_jobs

Filters:
    - Last 24 hours
    - 0 to 6 years experience
    - Resume skill matching
    - City matching
    - Maximum 2 jobs per company

Run:
    python -m pip install -r crawler/requirements.txt
    python crawler/crawl.py

Required .env:
    MONGODB_URI=...

Optional:
    RESUME_PATH=C:/Users/utkar/Downloads/Utkarsh_Resume.pdf
    CRAWL_LIMIT=0
    REQUEST_DELAY_SECONDS=1.5
    HEADLESS=true
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import quote_plus

import pandas as pd
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from selenium import webdriver
from selenium.common.exceptions import (
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options


# ============================================================
# PDF
# ============================================================

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None


# ============================================================
# ROOT / ENV
# ============================================================

ROOT = Path(__file__).resolve().parent.parent

load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local", override=True)


# ============================================================
# CONFIGURATION
# ============================================================

RESUME_PATH = os.getenv(
    "RESUME_PATH",
    r"C:/Users/utkar/Downloads/Utkarsh_Resume.pdf",
)

FRESHNESS_HOURS = 24

MIN_EXPERIENCE = 0
MAX_EXPERIENCE = 6

MIN_MATCH_SCORE = 30

LOCATION = "ALL"


# ============================================================
# ORIGINAL DATABASE CITY STRUCTURE
# ============================================================

COLLECTIONS = (
    ("companies", "Hyderabad"),
    ("bengaluru_listings", "Bengaluru"),
    ("gurugram_noida_delhi_listings", "Delhi NCR"),
    ("pune_listings", "Pune"),
    ("ahmedabad_listings", "Ahmedabad"),
)


CITY_KEYWORDS = {
    "Hyderabad": (
        "hyderabad",
        "secunderabad",
        "hitec city",
        "hitech city",
        "gachibowli",
    ),

    "Bengaluru": (
        "bengaluru",
        "bangalore",
        "whitefield",
        "koramangala",
        "electronic city",
    ),

    "Delhi NCR": (
        "delhi",
        "new delhi",
        "gurugram",
        "gurgaon",
        "noida",
        "ncr",
        "faridabad",
        "ghaziabad",
    ),

    "Pune": (
        "pune",
        "hinjewadi",
        "pimpri",
        "wakad",
    ),

    "Ahmedabad": (
        "ahmedabad",
        "gandhinagar",
        "gift city",
    ),
}


# ============================================================
# CITY SEARCH CONFIGURATION
# ============================================================

CITY_SEARCH_NAMES = {
    "Hyderabad": "Hyderabad",
    "Bengaluru": "Bengaluru",
    "Delhi NCR": "Delhi NCR",
    "Pune": "Pune",
    "Ahmedabad": "Ahmedabad",
}


WELLFOUND_CITY_NAMES = {
    "Hyderabad": "hyderabad",
    "Bengaluru": "bangalore",
    "Delhi NCR": "delhi",
    "Pune": "pune",
    "Ahmedabad": "ahmedabad",
}


# ============================================================
# JOB SEARCH QUERIES
# ============================================================

SEARCH_QUERIES = [
    "Full Stack Developer",
    "Full Stack Engineer",

    "Software Development Engineer",
    "Software Engineer",
    "Software Developer",

    "Frontend Developer",
    "Frontend Engineer",

    "Backend Developer",
    "Backend Engineer",

    "Node.js Developer",
    "Node.js Engineer",

    "React Developer",
    "React Engineer",

    "MERN Stack Developer",

    "JavaScript Developer",
    "JavaScript Engineer",

    "TypeScript Developer",
    "TypeScript Engineer",

    "Next.js Developer",
    "Next.js Engineer",

    "Web Developer",

    "AI Engineer",
    "Python Developer",
]


# ============================================================
# MATCHING WEIGHTS
# ============================================================

TITLE_WEIGHT = 0.60
DESCRIPTION_WEIGHT = 0.25
SKILL_WEIGHT = 0.15

ALLOW_MISSING_DESCRIPTION = True
ALLOW_UNKNOWN_EXPERIENCE = True

MIN_CORE_MATCHES = 1


# ============================================================
# SCRAPER SETTINGS
# ============================================================

HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"

PAGE_LOAD_TIMEOUT = int(
    os.getenv("PAGE_LOAD_TIMEOUT", "30")
)

WAIT_TIME = int(
    os.getenv("WAIT_TIME", "5")
)

REQUEST_DELAY = float(
    os.getenv("REQUEST_DELAY_SECONDS", "1.5")
)

MAX_JOBS_PER_QUERY = int(
    os.getenv("MAX_JOBS_PER_QUERY", "80")
)

MAX_JOBS_PER_COMPANY = 2

CRAWL_LIMIT = int(
    os.getenv("CRAWL_LIMIT", "0")
)


# ============================================================
# OUTPUT
# ============================================================

JOBS_JSON = ROOT / "jobs.json"
JOBS_CSV = ROOT / "jobs.csv"
REJECTED_JSON = ROOT / "rejected_jobs.json"
LOG_FILE = ROOT / "job_scraper.log"


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s:%(message)s",
)

console = logging.StreamHandler()
console.setLevel(logging.INFO)

formatter = logging.Formatter(
    "%(asctime)s %(levelname)s:%(message)s"
)

console.setFormatter(formatter)

logging.getLogger("").addHandler(console)


# ============================================================
# SKILL ALIASES
# ============================================================

SKILL_ALIASES = {

    # JavaScript
    "javascript": [
        "javascript",
        "js",
    ],

    "typescript": [
        "typescript",
        "ts",
    ],

    "node.js": [
        "node.js",
        "nodejs",
        "node js",
    ],

    "express.js": [
        "express.js",
        "expressjs",
        "express js",
        "express",
    ],

    "react": [
        "react",
        "react.js",
        "reactjs",
        "react js",
    ],

    "next.js": [
        "next.js",
        "nextjs",
        "next js",
    ],

    "socket.io": [
        "socket.io",
        "socketio",
        "socket io",
    ],

    "tailwindcss": [
        "tailwindcss",
        "tailwind css",
        "tailwind",
    ],

    "shadcn ui": [
        "shadcn",
        "shadcn ui",
    ],

    "zod": [
        "zod",
    ],

    # Backend
    "backend": [
        "backend",
        "back-end",
        "back end",
    ],

    "frontend": [
        "frontend",
        "front-end",
        "front end",
    ],

    "full stack": [
        "full stack",
        "full-stack",
        "fullstack",
    ],

    "rest api": [
        "rest api",
        "restful api",
        "rest apis",
    ],

    "api": [
        "api",
        "apis",
    ],

    "mongodb": [
        "mongodb",
        "mongo db",
        "mongo",
    ],

    "mongoose": [
        "mongoose",
    ],

    "prisma": [
        "prisma",
    ],

    "redis": [
        "redis",
    ],

    # Cloud
    "aws": [
        "aws",
        "amazon web services",
    ],

    "aws s3": [
        "aws s3",
        "amazon s3",
        "s3",
    ],

    # Programming
    "c++": [
        "c++",
        "cpp",
    ],

    "python": [
        "python",
    ],

    # AI
    "artificial intelligence": [
        "artificial intelligence",
        "ai",
    ],

    "ai agents": [
        "ai agents",
        "ai agent",
        "agentic ai",
    ],

    "langchain": [
        "langchain",
    ],

    "langgraph": [
        "langgraph",
    ],

    "rag": [
        "rag",
        "retrieval augmented generation",
        "retrieval-augmented generation",
    ],

    # Other
    "git": [
        "git",
        "github",
        "gitlab",
    ],

    "real-time systems": [
        "real-time systems",
        "realtime systems",
        "real time systems",
        "real-time",
        "realtime",
    ],
}


# ============================================================
# CORE SKILLS
# ============================================================

CORE_SKILLS = {
    "javascript",
    "typescript",
    "node.js",
    "express.js",
    "react",
    "next.js",
    "backend",
    "frontend",
    "full stack",
    "mongodb",
    "mongoose",
    "rest api",
    "api",
    "aws",
    "git",
}


# ============================================================
# RELATED SKILLS
# ============================================================

RELATED_SKILLS = {

    "node.js": {
        "express.js",
        "javascript",
        "typescript",
        "backend",
        "api",
        "rest api",
    },

    "express.js": {
        "node.js",
        "javascript",
        "typescript",
        "backend",
        "api",
        "rest api",
    },

    "react": {
        "javascript",
        "typescript",
        "frontend",
        "next.js",
    },

    "next.js": {
        "react",
        "javascript",
        "typescript",
        "frontend",
    },

    "javascript": {
        "typescript",
        "react",
        "node.js",
        "express.js",
        "frontend",
        "backend",
    },

    "typescript": {
        "javascript",
        "react",
        "node.js",
        "next.js",
    },

    "mongodb": {
        "mongoose",
        "backend",
        "node.js",
    },

    "mongoose": {
        "mongodb",
        "node.js",
        "backend",
    },

    "aws": {
        "aws s3",
        "backend",
    },

    "aws s3": {
        "aws",
    },

    "backend": {
        "node.js",
        "express.js",
        "api",
        "rest api",
        "mongodb",
        "aws",
    },

    "frontend": {
        "react",
        "next.js",
        "javascript",
        "typescript",
        "tailwindcss",
    },

    "full stack": {
        "frontend",
        "backend",
        "react",
        "node.js",
        "javascript",
        "typescript",
    },

    "api": {
        "rest api",
        "backend",
        "node.js",
        "express.js",
    },

    "rest api": {
        "api",
        "backend",
        "node.js",
        "express.js",
    },

    "ai agents": {
        "artificial intelligence",
        "langchain",
        "langgraph",
        "rag",
    },

    "artificial intelligence": {
        "ai agents",
        "langchain",
        "langgraph",
        "rag",
    },

    "langchain": {
        "ai agents",
        "artificial intelligence",
        "rag",
    },

    "langgraph": {
        "ai agents",
        "artificial intelligence",
        "rag",
    },

    "rag": {
        "ai agents",
        "artificial intelligence",
        "langchain",
    },
}


# ============================================================
# TEXT HELPERS
# ============================================================

def normalize_text(text):
    if not text:
        return ""

    text = str(text).lower()

    replacements = {
        "node js": "node.js",
        "nodejs": "node.js",
        "reactjs": "react",
        "react js": "react",
        "nextjs": "next.js",
        "next js": "next.js",
        "expressjs": "express.js",
        "express js": "express.js",
        "mongo db": "mongodb",
        "tailwind css": "tailwindcss",
        "real time": "real-time",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def contains_term(text, term):

    text = normalize_text(text)
    term = normalize_text(term)

    if not text or not term:
        return False

    pattern = (
        r"(?<![a-z0-9])"
        + re.escape(term)
        + r"(?![a-z0-9])"
    )

    return re.search(pattern, text) is not None


# ============================================================
# RESUME
# ============================================================

def extract_pdf_text(path):

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Resume file not found: {path}"
        )

    if PyPDF2 is None:
        raise ImportError(
            "PyPDF2 is not installed. "
            "Run: pip install PyPDF2"
        )

    text_parts = []

    with open(path, "rb") as file:

        reader = PyPDF2.PdfReader(file)

        for page in reader.pages:

            try:
                text = page.extract_text()

                if text:
                    text_parts.append(text)

            except Exception as e:
                logging.warning(
                    "Could not extract PDF page: %s",
                    e,
                )

    return "\n".join(text_parts)


def detect_resume_skills(resume_text):

    text = normalize_text(resume_text)

    detected = set()

    for canonical, aliases in SKILL_ALIASES.items():

        for alias in aliases:

            if contains_term(text, alias):
                detected.add(canonical)
                break

    return sorted(detected)


# ============================================================
# EXPERIENCE
# ============================================================

def parse_experience(text):

    if not text:
        return None

    text = normalize_text(text)

    # 0-2 years
    # 1 - 3 years
    # 2 to 5 years
    # 3+ years
    # 2 years

    patterns = [

        (
            r"(\d+(?:\.\d+)?)\s*"
            r"(?:-|to)\s*"
            r"(\d+(?:\.\d+)?)\s*"
            r"(?:years?|yrs?)"
        ),

        (
            r"(\d+(?:\.\d+)?)\s*\+\s*"
            r"(?:years?|yrs?)"
        ),

        (
            r"(\d+(?:\.\d+)?)\s*"
            r"(?:years?|yrs?)"
        ),
    ]

    for pattern in patterns:

        match = re.search(pattern, text)

        if not match:
            continue

        try:

            groups = match.groups()

            if len(groups) == 2:

                low = float(groups[0])
                high = float(groups[1])

                return {
                    "min": low,
                    "max": high,
                }

            value = float(groups[0])

            if "+" in match.group(0):
                return {
                    "min": value,
                    "max": 99,
                }

            return {
                "min": value,
                "max": value,
            }

        except Exception:
            continue

    return None


def experience_matches(job):

    experience = job.get("experience", "")

    if not experience:

        return (
            ALLOW_UNKNOWN_EXPERIENCE
        )

    parsed = parse_experience(experience)

    if not parsed:

        return (
            ALLOW_UNKNOWN_EXPERIENCE
        )

    job_min = parsed["min"]
    job_max = parsed["max"]

    # Overlap with target 0-6 years.
    return (
        job_min <= MAX_EXPERIENCE
        and
        job_max >= MIN_EXPERIENCE
    )


# ============================================================
# SKILL DETECTION
# ============================================================

def detect_job_skills(job):

    title = normalize_text(
        job.get("title", "")
    )

    description = normalize_text(
        job.get("description", "")
    )

    combined = title + " " + description

    detected = set()

    for canonical, aliases in SKILL_ALIASES.items():

        for alias in aliases:

            if contains_term(combined, alias):

                detected.add(canonical)
                break

    return sorted(detected)


def detect_title_skills(job):

    title = normalize_text(
        job.get("title", "")
    )

    detected = set()

    for canonical, aliases in SKILL_ALIASES.items():

        for alias in aliases:

            if contains_term(title, alias):

                detected.add(canonical)
                break

    return sorted(detected)


# ============================================================
# SKILL MATCHING
# ============================================================

def direct_skill_match(
    resume_skill,
    job_skills,
):

    if resume_skill in job_skills:
        return 1.0

    related = RELATED_SKILLS.get(
        resume_skill,
        set(),
    )

    if related.intersection(
        set(job_skills)
    ):
        return 0.50

    return 0.0


def calculate_skill_score(
    resume_skills,
    job_skills,
):

    if not resume_skills:
        return 0

    total = 0
    possible = 0

    for skill in resume_skills:

        weight = (
            1.5
            if skill in CORE_SKILLS
            else 1.0
        )

        possible += weight

        total += (
            direct_skill_match(
                skill,
                job_skills,
            )
            * weight
        )

    if possible == 0:
        return 0

    return (
        total / possible
    ) * 100


# ============================================================
# TITLE SCORE
# ============================================================

def calculate_title_score(
    resume_skills,
    title_skills,
):

    if not resume_skills:
        return 0

    if not title_skills:
        return 0

    matched = 0
    max_possible = 0

    title_skill_set = set(title_skills)

    for skill in resume_skills:

        weight = (
            1.5
            if skill in CORE_SKILLS
            else 1.0
        )

        max_possible += weight

        if skill in title_skill_set:

            matched += weight

        else:

            related = RELATED_SKILLS.get(
                skill,
                set(),
            )

            if related.intersection(
                title_skill_set
            ):
                matched += 0.50

    if max_possible == 0:
        return 0

    return min(
        100,
        (matched / max_possible) * 100,
    )


# ============================================================
# ROLE BONUS
# ============================================================

def calculate_role_bonus(job):

    title = normalize_text(
        job.get("title", "")
    )

    role_keywords = {

        "full stack": 10,
        "backend": 7,
        "frontend": 7,

        "software engineer": 6,
        "software developer": 6,

        "node.js": 7,
        "react": 6,
        "next.js": 6,

        "javascript": 5,
        "typescript": 5,

        "web developer": 5,

        "ai engineer": 4,
    }

    bonus = 0

    for keyword, points in role_keywords.items():

        if contains_term(
            title,
            keyword,
        ):
            bonus = max(
                bonus,
                points,
            )

    return bonus


# ============================================================
# MATCH ENGINE
# ============================================================

def calculate_match(
    job,
    resume_skills,
):

    title = normalize_text(
        job.get("title", "")
    )

    description = normalize_text(
        job.get("description", "")
    )

    title_skills = detect_title_skills(job)
    job_skills = detect_job_skills(job)

    title_score = calculate_title_score(
        resume_skills,
        title_skills,
    )

    if description:

        description_score = calculate_skill_score(
            resume_skills,
            job_skills,
        )

    else:

        description_score = 0

    skill_score = calculate_skill_score(
        resume_skills,
        job_skills,
    )

    if description:

        score = (
            title_score * TITLE_WEIGHT
            +
            description_score * DESCRIPTION_WEIGHT
            +
            skill_score * SKILL_WEIGHT
        )

    else:

        score = (
            title_score * 0.70
            +
            skill_score * 0.30
        )

    score += calculate_role_bonus(job)

    score = min(100, score)

    matched_skills = []
    title_matched_skills = []
    core_matches = []

    for skill in resume_skills:

        if skill in job_skills:
            matched_skills.append(skill)

        if skill in title_skills:
            title_matched_skills.append(skill)

        if (
            skill in CORE_SKILLS
            and
            skill in job_skills
        ):
            core_matches.append(skill)

    exp_ok = experience_matches(job)

    rejection_reason = ""

    if not exp_ok:

        rejection_reason = (
            "Experience outside 0-6 years"
        )

    elif score < MIN_MATCH_SCORE:

        if not (
            len(core_matches)
            >= MIN_CORE_MATCHES
            and score >= 25
        ):

            rejection_reason = (
                f"Match score below "
                f"{MIN_MATCH_SCORE}%"
            )

    return {

        "match_score": round(
            score,
            2,
        ),

        "matched_skills":
            matched_skills,

        "title_matched_skills":
            title_matched_skills,

        "matched_core_skills":
            core_matches,

        "job_detected_skills":
            job_skills,

        "experience_check": (
            "Experience matches"
            if exp_ok
            else "Experience outside range"
        ),

        "rejection_reason":
            rejection_reason,
    }


# ============================================================
# DRIVER
# ============================================================

def create_driver():

    options = Options()

    if HEADLESS:
        options.add_argument(
            "--headless=new"
        )

    options.add_argument(
        "--window-size=1920,1080"
    )

    options.add_argument(
        "--disable-blink-features=AutomationControlled"
    )

    options.add_argument(
        "--disable-notifications"
    )

    options.add_argument(
        "--disable-popup-blocking"
    )

    options.add_argument(
        "--no-sandbox"
    )

    options.add_argument(
        "--disable-dev-shm-usage"
    )

    options.add_argument(
        "--lang=en-US"
    )

    options.add_argument(
        "--disable-gpu"
    )

    options.add_argument(
        "--start-maximized"
    )

    options.add_argument(
        "--user-agent=Mozilla/5.0 "
        "(Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) "
        "Chrome/138.0.0.0 Safari/537.36"
    )

    driver = webdriver.Chrome(
        options=options
    )

    driver.set_page_load_timeout(
        PAGE_LOAD_TIMEOUT
    )

    return driver


# ============================================================
# SAFE GET
# ============================================================

def safe_get(
    driver,
    url,
):

    try:

        driver.get(url)

        time.sleep(WAIT_TIME)

        return True

    except (
        TimeoutException,
        WebDriverException,
        Exception,
    ) as e:

        logging.warning(
            "Could not load %s: %s",
            url,
            e,
        )

        return False


# ============================================================
# DATE / FRESHNESS HELPERS
# ============================================================

def parse_relative_posted(text):

    if not text:
        return None

    text = normalize_text(text)

    now = datetime.now(
        timezone.utc
    )

    # just now
    if (
        "just now" in text
        or
        "today" in text
    ):
        return now

    if "yesterday" in text:
        return now - timedelta(
            days=1
        )

    # 5 minutes ago
    match = re.search(
        r"(\d+)\s*(minute|minutes|min|mins)\s*ago",
        text,
    )

    if match:

        return now - timedelta(
            minutes=int(
                match.group(1)
            )
        )

    # 5 hours ago
    match = re.search(
        r"(\d+)\s*(hour|hours|hr|hrs)\s*ago",
        text,
    )

    if match:

        return now - timedelta(
            hours=int(
                match.group(1)
            )
        )

    # 2 days ago
    match = re.search(
        r"(\d+)\s*(day|days)\s*ago",
        text,
    )

    if match:

        return now - timedelta(
            days=int(
                match.group(1)
            )
        )

    # 30+ days
    match = re.search(
        r"(\d+)\s*\+?\s*days?",
        text,
    )

    if match and (
        "ago" in text
        or
        "posted" in text
    ):

        return now - timedelta(
            days=int(
                match.group(1)
            )
        )

    return None


def is_recent_job(
    posted_text,
):

    if not posted_text:
        return True

    posted_at = parse_relative_posted(
        posted_text
    )

    if posted_at is None:

        # Unknown date should not
        # automatically destroy a job.
        return True

    cutoff = (
        datetime.now(timezone.utc)
        -
        timedelta(
            hours=FRESHNESS_HOURS
        )
    )

    return posted_at >= cutoff


# ============================================================
# EXPERIENCE TEXT EXTRACTION
# ============================================================

def extract_experience_from_text(
    text,
):

    if not text:
        return ""

    normalized = normalize_text(text)

    patterns = [

        r"\d+\s*(?:-|to)\s*\d+\s*(?:years?|yrs?)",

        r"\d+\s*\+\s*(?:years?|yrs?)",

        r"\d+\s*(?:years?|yrs?)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            normalized,
        )

        if match:
            return match.group(0)

    return ""


# ============================================================
# LOCATION
# ============================================================

def detect_city(
    location,
):

    text = normalize_text(
        location
    )

    if not text:
        return None

    for city, keywords in CITY_KEYWORDS.items():

        for keyword in keywords:

            if keyword in text:
                return city

    if "remote" in text:

        return "Remote"

    return None


def location_matches_city(
    location,
    target_city,
):

    if not location:
        return True

    city = detect_city(
        location
    )

    if city == target_city:
        return True

    if city == "Remote":
        return True

    return False


# ============================================================
# GENERIC JOB CARD EXTRACTION
# ============================================================

def clean_text(text):

    if not text:
        return ""

    return re.sub(
        r"\s+",
        " ",
        text,
    ).strip()


# ============================================================
# NAUKRI
# ============================================================

def scrape_naukri(
    driver,
    city,
):

    jobs = []

    logging.info(
        "Searching Naukri for %s",
        city,
    )

    city_slug = (
        CITY_SEARCH_NAMES[city]
        .lower()
        .replace(
            " ",
            "-",
        )
    )

    for query in SEARCH_QUERIES:

        slug = query.lower()

        slug = slug.replace(
            " ",
            "-",
        )

        slug = re.sub(
            r"[^a-z0-9\-.]",
            "",
            slug,
        )

        url = (
            "https://www.naukri.com/"
            f"{slug}-jobs-in-{city_slug}"
        )

        logging.info(
            "Naukri URL: %s",
            url,
        )

        if not safe_get(
            driver,
            url,
        ):
            continue

        try:

            selectors = [
                "article.jobTuple",
                "div.cust-job-tuple",
                "div.jobTuple",
                "div.srp-jobtuple-wrapper",
            ]

            cards = []

            for selector in selectors:

                found = driver.find_elements(
                    By.CSS_SELECTOR,
                    selector,
                )

                if found:
                    cards = found
                    break

            logging.info(
                "Naukri %s cards: %d",
                city,
                len(cards),
            )

            for card in cards[
                :MAX_JOBS_PER_QUERY
            ]:

                try:

                    text = clean_text(
                        card.text
                    )

                    if not text:
                        continue

                    title = ""

                    for selector in [
                        "a.title",
                        "a[class*='title']",
                        "h2",
                        "h3",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            title = clean_text(
                                elements[0].text
                            )

                            break

                    if not title:
                        continue

                    company = ""

                    for selector in [
                        "a.comp-name",
                        "a[class*='comp']",
                        "span[class*='comp']",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            company = clean_text(
                                elements[0].text
                            )

                            break

                    location = ""

                    for selector in [
                        "span.locWdth",
                        "span[class*='loc']",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            location = clean_text(
                                elements[0].text
                            )

                            break

                    experience = ""

                    for selector in [
                        "span.expwdth",
                        "span[class*='exp']",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            experience = clean_text(
                                elements[0].text
                            )

                            break

                    if not experience:
                        experience = (
                            extract_experience_from_text(
                                text
                            )
                        )

                    posted = ""

                    # Search text for relative
                    # posting time.
                    posted_match = re.search(
                        r"(\d+\s*(?:minutes?|mins?|"
                        r"hours?|hrs?|days?)\s*ago|"
                        r"today|just now|yesterday)",
                        text,
                        re.I,
                    )

                    if posted_match:
                        posted = (
                            posted_match.group(1)
                        )

                    if not is_recent_job(
                        posted
                    ):
                        continue

                    url_job = ""

                    try:

                        link = card.find_element(
                            By.CSS_SELECTOR,
                            "a",
                        )

                        url_job = (
                            link.get_attribute(
                                "href"
                            )
                            or ""
                        )

                    except Exception:
                        pass

                    jobs.append({

                        "source": "Naukri",

                        "title": title,

                        "company": company,

                        "location":
                            location or city,

                        "experience":
                            experience,

                        "salary": "",

                        "posted": posted,

                        "url": url_job,

                        "description": text,
                    })

                except Exception as e:

                    logging.debug(
                        "Naukri card error: %s",
                        e,
                    )

        except Exception as e:

            logging.warning(
                "Naukri scraping error: %s",
                e,
            )

        time.sleep(
            REQUEST_DELAY
        )

    logging.info(
        "Naukri %s jobs found: %d",
        city,
        len(jobs),
    )

    return jobs


# ============================================================
# LINKEDIN
# ============================================================

def scrape_linkedin(
    driver,
    city,
):

    jobs = []

    logging.info(
        "Searching LinkedIn for %s",
        city,
    )

    for query in SEARCH_QUERIES:

        encoded = quote_plus(
            query
        )

        url = (
            "https://www.linkedin.com/jobs/search/"
            f"?keywords={encoded}"
            f"&location={quote_plus(city)}"
            f"&f_TPR=r{FRESHNESS_HOURS * 3600}"
            "&sortBy=DD"
        )

        logging.info(
            "LinkedIn URL: %s",
            url,
        )

        if not safe_get(
            driver,
            url,
        ):
            continue

        try:

            for _ in range(4):

                driver.execute_script(
                    "window.scrollTo("
                    "0, document.body.scrollHeight"
                    ");"
                )

                time.sleep(1)

            selectors = [

                "li.jobs-search-results__list-item",

                "div.base-card",

                "li.base-card",

                "div.job-search-card",
            ]

            cards = []

            for selector in selectors:

                found = driver.find_elements(
                    By.CSS_SELECTOR,
                    selector,
                )

                if found:

                    cards = found
                    break

            logging.info(
                "LinkedIn %s cards: %d",
                city,
                len(cards),
            )

            for card in cards[
                :MAX_JOBS_PER_QUERY
            ]:

                try:

                    text = clean_text(
                        card.text
                    )

                    if not text:
                        continue

                    title = ""

                    for selector in [

                        "h3.base-search-card__title",

                        "h3",

                        "a.base-card__full-link",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            title = clean_text(
                                elements[0].text
                            )

                            break

                    if not title:
                        continue

                    company = ""

                    for selector in [

                        "h4.base-search-card__subtitle",

                        "h4",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            company = clean_text(
                                elements[0].text
                            )

                            break

                    location = ""

                    for selector in [

                        "span.job-search-card__location",

                        "span[class*='location']",
                    ]:

                        elements = (
                            card.find_elements(
                                By.CSS_SELECTOR,
                                selector,
                            )
                        )

                        if elements:

                            location = clean_text(
                                elements[0].text
                            )

                            break

                    experience = (
                        extract_experience_from_text(
                            text
                        )
                    )

                    posted = ""

                    posted_match = re.search(
                        r"(\d+\s*(?:minutes?|mins?|"
                        r"hours?|hrs?|days?)\s*ago|"
                        r"today|just now|yesterday)",
                        text,
                        re.I,
                    )

                    if posted_match:

                        posted = (
                            posted_match.group(1)
                        )

                    if not is_recent_job(
                        posted
                    ):
                        continue

                    url_job = ""

                    try:

                        link = card.find_element(
                            By.CSS_SELECTOR,
                            "a",
                        )

                        url_job = (
                            link.get_attribute(
                                "href"
                            )
                            or ""
                        )

                    except Exception:
                        pass

                    jobs.append({

                        "source": "LinkedIn",

                        "title": title,

                        "company": company,

                        "location":
                            location or city,

                        "experience":
                            experience,

                        "salary": "",

                        "posted": posted,

                        "url": url_job,

                        "description": text,
                    })

                except Exception as e:

                    logging.debug(
                        "LinkedIn card error: %s",
                        e,
                    )

        except Exception as e:

            logging.warning(
                "LinkedIn scraping error: %s",
                e,
            )

        time.sleep(
            REQUEST_DELAY
        )

    logging.info(
        "LinkedIn %s jobs found: %d",
        city,
        len(jobs),
    )

    return jobs


# ============================================================
# WELLFOUND
# ============================================================

def scrape_wellfound(
    driver,
    city,
):

    jobs = []

    logging.info(
        "Searching Wellfound for %s",
        city,
    )

    wellfound_city = (
        WELLFOUND_CITY_NAMES[city]
    )

    role_urls = [

        "software-engineer",

        "full-stack-engineer",

        "software-developer",

        "frontend-engineer",

        "backend-engineer",

        "nodejs-developer",

        "react-developer",
    ]

    for role in role_urls:

        url = (
            "https://wellfound.com/role/l/"
            f"{role}/{wellfound_city}"
        )

        logging.info(
            "Wellfound URL: %s",
            url,
        )

        if not safe_get(
            driver,
            url,
        ):
            continue

        try:

            soup = BeautifulSoup(
                driver.page_source,
                "html.parser",
            )

            links = soup.find_all(
                "a",
                href=re.compile(
                    r"/jobs/"
                ),
            )

            seen_urls = set()

            for link in links:

                href = link.get(
                    "href",
                    "",
                )

                if not href:
                    continue

                if href.startswith("/"):

                    href = (
                        "https://wellfound.com"
                        + href
                    )

                if href in seen_urls:
                    continue

                seen_urls.add(href)

                title = clean_text(
                    link.get_text(
                        " ",
                        strip=True,
                    )
                )

                if len(title) < 3:
                    continue

                parent_text = ""

                try:

                    parent = link.parent

                    if parent:

                        parent_text = clean_text(
                            parent.get_text(
                                " ",
                                strip=True,
                            )
                        )

                except Exception:
                    pass

                experience = (
                    extract_experience_from_text(
                        parent_text
                    )
                )

                posted_match = re.search(
                    r"(\d+\s*(?:minutes?|mins?|"
                    r"hours?|hrs?|days?)\s*ago|"
                    r"today|just now|yesterday)",
                    parent_text,
                    re.I,
                )

                posted = ""

                if posted_match:
                    posted = (
                        posted_match.group(1)
                    )

                if not is_recent_job(
                    posted
                ):
                    continue

                jobs.append({

                    "source": "Wellfound",

                    "title": title,

                    "company": "",

                    "location": city,

                    "experience":
                        experience,

                    "salary": "",

                    "posted": posted,

                    "url": href,

                    "description":
                        parent_text,
                })

        except Exception as e:

            logging.warning(
                "Wellfound scraping error: %s",
                e,
            )

        time.sleep(
            REQUEST_DELAY
        )

    logging.info(
        "Wellfound %s jobs found: %d",
        city,
        len(jobs),
    )

    return jobs


# ============================================================
# DEDUPLICATION
# ============================================================

def normalize_job_url(url):

    if not url:
        return ""

    url = url.strip()

    url = url.split("?")[0]

    return url.rstrip("/").lower()


def deduplicate_jobs(jobs):

    unique = {}

    for job in jobs:

        url = normalize_job_url(
            job.get("url", "")
        )

        if url:

            key = url

        else:

            key = (
                normalize_text(
                    job.get(
                        "title",
                        "",
                    )
                )
                +
                "|"
                +
                normalize_text(
                    job.get(
                        "company",
                        "",
                    )
                )
            )

        if key not in unique:

            unique[key] = job

        else:

            old = unique[key]

            old_text = (
                old.get(
                    "description",
                    "",
                )
                or ""
            )

            new_text = (
                job.get(
                    "description",
                    "",
                )
                or ""
            )

            if len(new_text) > len(
                old_text
            ):

                unique[key] = job

    return list(
        unique.values()
    )


# ============================================================
# LOAD COMPANIES FROM ORIGINAL DATABASE
# ============================================================

def load_companies(db):

    companies = []

    seen = set()

    for collection_name, map_city in COLLECTIONS:

        cursor = db[
            collection_name
        ].find(
            {
                "website": {
                    "$exists": True,
                    "$nin": [
                        None,
                        "",
                    ],
                }
            },
            {
                "id": 1,
                "name": 1,
                "website": 1,
            },
        )

        for doc in cursor:

            company_id = str(
                doc.get("id") or ""
            ).strip()

            name = str(
                doc.get("name") or ""
            ).strip()

            website = str(
                doc.get("website") or ""
            ).strip()

            if (
                not company_id
                or not name
            ):
                continue

            key = (
                normalize_text(name)
                + "|"
                + map_city
            )

            if key in seen:
                continue

            seen.add(key)

            companies.append({

                "id": company_id,

                "name": name,

                "website": website,

                "map_city": map_city,
            })

    return companies


# ============================================================
# COMPANY NAME NORMALIZATION
# ============================================================

def normalize_company_name(name):

    if not name:
        return ""

    text = normalize_text(
        name
    )

    text = re.sub(
        r"\b(private limited|"
        r"pvt ltd|"
        r"pvt\. ltd\.|"
        r"limited|"
        r"ltd|"
        r"inc|"
        r"llc)\b",
        "",
        text,
    )

    text = re.sub(
        r"[^a-z0-9]+",
        " ",
        text,
    )

    return text.strip()


def build_company_index(
    companies,
):

    index = {}

    for company in companies:

        key = normalize_company_name(
            company["name"]
        )

        if not key:
            continue

        index.setdefault(
            key,
            [],
        ).append(company)

    return index


def find_company(
    company_name,
    city,
    company_index,
):

    normalized = (
        normalize_company_name(
            company_name
        )
    )

    if not normalized:
        return None

    candidates = (
        company_index.get(
            normalized,
            [],
        )
    )

    for company in candidates:

        if (
            company["map_city"]
            == city
        ):
            return company

    if candidates:
        return candidates[0]

    # Partial matching
    for key, companies in (
        company_index.items()
    ):

        if (
            normalized in key
            or key in normalized
        ):

            for company in companies:

                if (
                    company["map_city"]
                    == city
                ):
                    return company

    return None


# ============================================================
# CITY FILTER
# ============================================================

def filter_city_jobs(
    jobs,
    city,
):

    filtered = []

    for job in jobs:

        location = job.get(
            "location",
            "",
        )

        if location_matches_city(
            location,
            city,
        ):

            filtered.append(job)

    return filtered


# ============================================================
# FINAL FILTER
# ============================================================

def filter_jobs(
    jobs,
    resume_skills,
    city,
):

    matching = []
    rejected = []

    city_jobs = filter_city_jobs(
        jobs,
        city,
    )

    for job in city_jobs:

        result = calculate_match(
            job,
            resume_skills,
        )

        job.update(result)

        if not job.get(
            "rejection_reason"
        ):

            matching.append(job)

        else:

            rejected.append(job)

    matching.sort(
        key=lambda x: x.get(
            "match_score",
            0,
        ),
        reverse=True,
    )

    rejected.sort(
        key=lambda x: x.get(
            "match_score",
            0,
        ),
        reverse=True,
    )

    return (
        matching,
        rejected,
    )


# ============================================================
# SAVE JSON
# ============================================================

def save_json(
    filename,
    data,
):

    with open(
        filename,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# SAVE CSV
# ============================================================

def save_csv(
    filename,
    data,
):

    if not data:

        pd.DataFrame().to_csv(
            filename,
            index=False,
        )

        return

    rows = []

    for job in data:

        row = dict(job)

        for key, value in row.items():

            if isinstance(
                value,
                list,
            ):

                row[key] = ", ".join(
                    map(
                        str,
                        value,
                    )
                )

        rows.append(row)

    df = pd.DataFrame(
        rows
    )

    df.to_csv(
        filename,
        index=False,
        encoding="utf-8-sig",
    )


# ============================================================
# MONGODB DOCUMENT
# ============================================================

def create_job_document(
    job,
    city,
    company,
):

    source = job.get(
        "source",
        "unknown",
    )

    url = job.get(
        "url",
        "",
    )

    title = job.get(
        "title",
        "",
    )

    external_key = (
        url
        or
        (
            normalize_text(
                title
            )
            + "|"
            +
            normalize_text(
                job.get(
                    "company",
                    "",
                )
            )
        )
    )

    external_id = hashlib.sha1(
        external_key.encode(
            "utf-8"
        )
    ).hexdigest()[:20]

    job_id = (
        f"{source.lower()}:"
        f"{external_id}"
    )

    company_name = (
        company["name"]
        if company
        else
        job.get(
            "company",
            "Unknown",
        )
    )

    company_id = (
        company["id"]
        if company
        else
        hashlib.sha1(
            normalize_company_name(
                company_name
            ).encode(
                "utf-8"
            )
        ).hexdigest()[:16]
    )

    return {

        # Original structure
        "id": job_id,

        "source": source,

        "companyName":
            company_name,

        "companyId":
            company_id,

        "title":
            job.get(
                "title",
                "",
            ),

        "city":
            city,

        "location":
            job.get(
                "location",
                "",
            )
            or city,

        "url":
            job.get(
                "url",
                "",
            ),

        "crawledAt":
            datetime.now(
                timezone.utc
            ),

        # Additional useful fields
        "experience":
            job.get(
                "experience",
                "",
            ),

        "posted":
            job.get(
                "posted",
                "",
            ),

        "salary":
            job.get(
                "salary",
                "",
            ),

        "matchScore":
            job.get(
                "match_score",
                0,
            ),

        "matchedSkills":
            job.get(
                "matched_skills",
                [],
            ),

        "titleMatchedSkills":
            job.get(
                "title_matched_skills",
                [],
            ),

        "matchedCoreSkills":
            job.get(
                "matched_core_skills",
                [],
            ),

        "jobDetectedSkills":
            job.get(
                "job_detected_skills",
                [],
            ),
    }


# ============================================================
# PRINT RESULTS
# ============================================================

def print_top_jobs(
    jobs,
    limit=30,
):

    print()
    print("=" * 75)
    print("TOP MATCHING JOBS")
    print("=" * 75)

    if not jobs:

        print(
            "No matching jobs found."
        )

        return

    for index, job in enumerate(
        jobs[:limit],
        start=1,
    ):

        print()

        print(
            f"{index}. "
            f"[{job.get('match_score', 0)}%] "
            f"{job.get('title', 'Unknown')}"
        )

        print(
            f"   Company: "
            f"{job.get('company', '') or 'Unknown'}"
        )

        print(
            f"   Source: "
            f"{job.get('source', '')}"
        )

        print(
            f"   City: "
            f"{job.get('city', '')}"
        )

        print(
            f"   Location: "
            f"{job.get('location', '') or 'Unknown'}"
        )

        print(
            f"   Experience: "
            f"{job.get('experience', '') or 'Unknown'}"
        )

        print(
            f"   Posted: "
            f"{job.get('posted', '') or 'Unknown'}"
        )

        print(
            "   Matched skills: "
            +
            ", ".join(
                job.get(
                    "matched_skills",
                    [],
                )
            )
        )

        print(
            "   Title matches: "
            +
            ", ".join(
                job.get(
                    "title_matched_skills",
                    [],
                )
            )
        )

        print(
            f"   URL: "
            f"{job.get('url', '')}"
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 75)
    print("RESUME-BASED MULTI-CITY JOB CRAWLER")
    print("=" * 75)
    print()

    print(
        f"Resume: {RESUME_PATH}"
    )

    print(
        f"Freshness: "
        f"Last {FRESHNESS_HOURS} hours"
    )

    print(
        f"Experience: "
        f"{MIN_EXPERIENCE}-{MAX_EXPERIENCE} years"
    )

    print(
        f"Minimum match score: "
        f"{MIN_MATCH_SCORE}%"
    )

    print(
        "Cities: "
        + ", ".join(
            CITY_SEARCH_NAMES.keys()
        )
    )

    print()

    # ========================================================
    # MONGODB
    # ========================================================

    uri = os.getenv(
        "MONGODB_URI"
    )

    if not uri:

        print(
            "ERROR: MONGODB_URI is missing."
        )

        return 1

    client = MongoClient(
        uri
    )

    try:

        db = client.get_default_database()

    except Exception:

        db = client[
            "hyderabad-map"
        ]

    hiring = db[
        "hiring_jobs"
    ]

    hiring.create_index(
        "id",
        unique=True,
    )

    hiring.create_index(
        "companyId"
    )

    hiring.create_index(
        "city"
    )

    hiring.create_index(
        "matchScore"
    )

    # ========================================================
    # LOAD COMPANIES
    # ========================================================

    print(
        "Loading companies from MongoDB..."
    )

    companies = load_companies(
        db
    )

    company_index = (
        build_company_index(
            companies
        )
    )

    print(
        f"Loaded {len(companies)} "
        f"companies from existing city collections."
    )

    # ========================================================
    # RESUME
    # ========================================================

    print()
    print(
        "Loading resume..."
    )

    try:

        resume_text = extract_pdf_text(
            RESUME_PATH
        )

    except Exception as e:

        print()
        print(
            f"ERROR: Could not load resume: {e}"
        )

        client.close()

        return 1

    if not resume_text.strip():

        print(
            "ERROR: Resume text is empty."
        )

        client.close()

        return 1

    resume_skills = (
        detect_resume_skills(
            resume_text
        )
    )

    print()
    print(
        f"Resume skills detected: "
        f"{len(resume_skills)}"
    )

    for skill in resume_skills:

        print(
            f"  ✓ {skill}"
        )

    # ========================================================
    # DRIVER
    # ========================================================

    print()
    print(
        "Starting Chrome..."
    )

    try:

        driver = create_driver()

    except Exception as e:

        print(
            "ERROR: Could not start Chrome."
        )

        print(e)

        client.close()

        return 1

    all_matching = []
    all_rejected = []

    # ========================================================
    # SCRAPING
    # ========================================================

    try:

        for city in CITY_SEARCH_NAMES:

            print()
            print("=" * 75)
            print(
                f"SEARCHING {city.upper()}"
            )
            print("=" * 75)

            city_raw_jobs = []

            # ------------------------------------------------
            # NAUKRI
            # ------------------------------------------------

            try:

                naukri_jobs = (
                    scrape_naukri(
                        driver,
                        city,
                    )
                )

                city_raw_jobs.extend(
                    naukri_jobs
                )

            except Exception as e:

                logging.exception(
                    "Naukri failed for %s",
                    city,
                )

                print(
                    f"Naukri error: {e}"
                )

            # ------------------------------------------------
            # LINKEDIN
            # ------------------------------------------------

            try:

                linkedin_jobs = (
                    scrape_linkedin(
                        driver,
                        city,
                    )
                )

                city_raw_jobs.extend(
                    linkedin_jobs
                )

            except Exception as e:

                logging.exception(
                    "LinkedIn failed for %s",
                    city,
                )

                print(
                    f"LinkedIn error: {e}"
                )

            # ------------------------------------------------
            # WELLFOUND
            # ------------------------------------------------

            try:

                wellfound_jobs = (
                    scrape_wellfound(
                        driver,
                        city,
                    )
                )

                city_raw_jobs.extend(
                    wellfound_jobs
                )

            except Exception as e:

                logging.exception(
                    "Wellfound failed for %s",
                    city,
                )

                print(
                    f"Wellfound error: {e}"
                )

            print(
                f"{city}: "
                f"{len(city_raw_jobs)} "
                f"raw jobs"
            )

            # ------------------------------------------------
            # DEDUP
            # ------------------------------------------------

            unique_city_jobs = (
                deduplicate_jobs(
                    city_raw_jobs
                )
            )

            print(
                f"{city}: "
                f"{len(unique_city_jobs)} "
                f"unique jobs"
            )

            # ------------------------------------------------
            # FILTER
            # ------------------------------------------------

            matching, rejected = (
                filter_jobs(
                    unique_city_jobs,
                    resume_skills,
                    city,
                )
            )

            print(
                f"{city}: "
                f"{len(matching)} "
                f"matching jobs"
            )

            print(
                f"{city}: "
                f"{len(rejected)} "
                f"rejected jobs"
            )

            all_matching.extend(
                matching
            )

            all_rejected.extend(
                rejected
            )

    finally:

        try:
            driver.quit()
        except Exception:
            pass

    # ========================================================
    # GLOBAL DEDUP
    # ========================================================

    all_matching = deduplicate_jobs(
        all_matching
    )

    print()
    print("=" * 75)
    print(
        f"TOTAL MATCHING JOBS: "
        f"{len(all_matching)}"
    )
    print("=" * 75)

    # ========================================================
    # MAX 2 JOBS PER COMPANY
    # ========================================================

    company_counts = {}

    limited_jobs = []

    for job in sorted(
        all_matching,
        key=lambda x: x.get(
            "match_score",
            0,
        ),
        reverse=True,
    ):

        company_name = normalize_company_name(
            job.get(
                "company",
                "",
            )
        )

        if not company_name:

            company_name = (
                normalize_company_name(
                    job.get(
                        "title",
                        "",
                    )
                )
            )

        count = company_counts.get(
            company_name,
            0,
        )

        if count >= MAX_JOBS_PER_COMPANY:
            continue

        company_counts[
            company_name
        ] = count + 1

        limited_jobs.append(
            job
        )

    print(
        f"After max "
        f"{MAX_JOBS_PER_COMPANY} jobs/company: "
        f"{len(limited_jobs)} jobs"
    )

    # ========================================================
    # MONGODB OPERATIONS
    # ========================================================

    operations = []

    processed_companies = set()

    for job in limited_jobs:

        city = job.get(
            "city",
            "",
        )

        company = find_company(
            job.get(
                "company",
                "",
            ),
            city,
            company_index,
        )

        if company:

            processed_companies.add(
                company["id"]
            )

        doc = create_job_document(
            job,
            city,
            company,
        )

        operations.append(

            UpdateOne(
                {
                    "id": doc["id"]
                },
                {
                    "$set": doc
                },
                upsert=True,
            )
        )

    # ========================================================
    # WRITE
    # ========================================================

    if operations:

        result = hiring.bulk_write(
            operations,
            ordered=False,
        )

        print()
        print(
            f"Wrote to "
            f"`{db.name}.hiring_jobs`:"
        )

        print(
            f"  Upserted: "
            f"{result.upserted_count}"
        )

        print(
            f"  Modified: "
            f"{result.modified_count}"
        )

        print(
            f"  Operations: "
            f"{len(operations)}"
        )

    else:

        print()
        print(
            f"No matching jobs to write "
            f"to `{db.name}.hiring_jobs`."
        )

    # ========================================================
    # REMOVE OLD JOBS FOR MATCHED COMPANIES
    # ========================================================

    # Important:
    # We do NOT blindly delete all old jobs because
    # Selenium sources do not always expose reliable
    # company identity.

    # ========================================================
    # SAVE LOCAL OUTPUTS
    # ========================================================

    save_json(
        JOBS_JSON,
        limited_jobs,
    )

    save_json(
        REJECTED_JSON,
        all_rejected,
    )

    save_csv(
        JOBS_CSV,
        limited_jobs,
    )

    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print_top_jobs(
        limited_jobs,
        limit=30,
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print("=" * 75)
    print("FINAL SUMMARY")
    print("=" * 75)

    print(
        f"Cities searched: "
        f"{len(CITY_SEARCH_NAMES)}"
    )

    print(
        f"Freshness: "
        f"{FRESHNESS_HOURS} hours"
    )

    print(
        f"Experience: "
        f"{MIN_EXPERIENCE}-{MAX_EXPERIENCE} years"
    )

    print(
        f"Final matching jobs: "
        f"{len(limited_jobs)}"
    )

    print(
        f"Rejected jobs: "
        f"{len(all_rejected)}"
    )

    print()
    print(
        f"✓ {JOBS_JSON}"
    )

    print(
        f"✓ {JOBS_CSV}"
    )

    print(
        f"✓ {REJECTED_JSON}"
    )

    print(
        f"✓ {LOG_FILE}"
    )

    print()
    print("=" * 75)
    print("DONE")
    print("=" * 75)

    client.close()

    return 0


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    raise SystemExit(
        main()
    )
