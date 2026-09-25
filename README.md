# Hyderabad Companies Map

![A map of Hyderabad with company clusters and a short count of listings](http://res.cloudinary.com/dakddv1pm/image/upload/v1788832997/posts/f0ftsg8z2nglckbq18cy.png)

A free, public discovery site for companies in **Hyderabad**, with separate maps and directories for
**Bengaluru**, **Gurugram, Noida & Delhi**, **Pune**, and **Ahmedabad**.

It is for people who want a sense of *where* businesses sit in the city — founders looking at neighbours, job seekers scanning an area, journalists checking a beat, or residents curious about the offices around them. It is not a government register, an official list, or an endorsement of anyone shown.

## Hyderabad

Open the map to see companies across Hyderabad, Telangana. Pins sit in familiar districts such as HITEC City, Gachibowli, and Genome Valley. Nearby listings group together so dense areas stay readable; zoom in to see individual names.

Each pin can show a short description and a link to the company’s website when we have one. Locations are approximate (a campus or business district), not a surveyed doorstep.

If you prefer reading to clicking a map, the Hyderabad directory lists the same companies as text, grouped by industry.

## Bengaluru

Bengaluru has its own map and its own directory. That view covers startups and venture capital firms. Those listings stay on the Bengaluru pages; they are not mixed into the Hyderabad map.

The Bengaluru directory is the full readable list. The map only shows names we have a place for on the city.

This project is independent of Bangalore Startup Map and of the companies listed. Names there come from public information; they can be incomplete or go out of date.

## Gurugram, Noida & Delhi

Delhi NCR has its own map and directory for companies across Gurugram, Noida, and Delhi. Those listings stay on the Delhi NCR pages; they are not mixed into the Hyderabad or Bengaluru maps.

## Pune

Pune has its own map and directory for companies across areas such as Hinjewadi, Baner, and Kharadi. Those listings stay on the Pune pages; they are not mixed into the other city maps.

## Ahmedabad

Ahmedabad has its own map and directory for companies across areas such as SG Highway, GIFT City, and Gandhinagar. Those listings stay on the Ahmedabad pages; they are not mixed into the other city maps.

## What you can do

- Explore Hyderabad on the map, then switch to Bengaluru, Delhi NCR, Pune, or Ahmedabad from the same kind of view
- Browse each region as a written directory
- Open a company for a short description and website when one is available
- See companies hiring by city at `/hiring`, filled by a local Python crawl into MongoDB
- Ask for a correction or a removal through the contact page

## Hiring crawl (local, optional)

`/hiring` only reads the `hiring_jobs` collection. Next.js does not crawl. On a machine with `MONGODB_URI`:

```bash
python -m pip install -r crawler/requirements.txt
python crawler/crawl.py
```

The script visits company websites from the existing map collections (round-robin by city), follows career links that actually exist on the homepage (it does not guess `/careers` `/jobs` `/join-us`), and upserts Greenhouse / Lever / Ashby / Workable / SmartRecruiters JSON roles plus role-like links from real career pages. Schedule `python crawler/crawl.py` once a day with Windows Task Scheduler (or cron). Do not hook it to `npm run dev`. Optional: `CRAWL_LIMIT` (default 80, `0` = all sites) and `CRAWL_DELAY_SECONDS` (default 1.5).

Inclusion does not mean a business relationship with the operator of this site.