Build only the map section of a startup-discovery website using React.js, TypeScript, and MapLibre GL JS.

I have uploaded a reference image. Use it as the visual reference for the map UI and marker behavior.

GOAL:
Create a polished interactive Hyderabad startup/company map that visually resembles the uploaded reference.

TECH STACK:
- react.js
- TypeScript
- MapLibre GL JS
- Tailwind CSS
- No other mapping library

DATA:
Create a static file:

data/companies.ts

Use this interface:

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  city: string;
  latitude: number;
  longitude: number;
  website?: string;
  logo?: string;
}

Add 30–50 Hyderabad-based companies/startups with realistic latitude/longitude coordinates around Hyderabad.

MAP:
- Center the map on Hyderabad, Telangana, India.
- Use a clean, light-colored basemap similar to the uploaded reference.
- Map should occupy the full available viewport.
- Support pan, zoom, scroll and touch interactions.
- Make the map responsive.

CLUSTERING:
Use MapLibre's built-in GeoJSON clustering.

Do NOT manually calculate clusters.

Create a GeoJSON source with:

cluster: true

Configure an appropriate:
- clusterRadius
- clusterMaxZoom

Create separate MapLibre layers for:

1. Cluster circles
2. Cluster count labels
3. Individual company points

Cluster appearance should resemble the reference:

- Small clusters → small circular marker
- Medium clusters → larger circular marker
- Large clusters → even larger circular marker
- Display the number of companies inside the cluster
- Use a clean green/yellow/orange visual hierarchy similar to the reference
- Add subtle transparency/border where appropriate

Example:

2–10 companies    → small green circle
11–50 companies   → medium yellow/green circle
51+ companies     → large orange circle

Use MapLibre expressions to dynamically control circle radius and styling based on `point_count`.

INDIVIDUAL COMPANY MARKERS:

When a cluster contains only one company, show an individual company marker.

The marker should look similar to the uploaded reference:

- White circular background
- Company logo centered inside
- Subtle border
- Soft shadow
- Slightly elevated appearance
- Clean and modern

If a company does not have a logo:
- Show the first letter of the company name
- Use a simple fallback icon if appropriate

POPUP:

When the user clicks an individual company marker, display a clean popup containing:

- Company logo
- Company name
- Industry
- Hyderabad
- Short description
- "Visit Website" button if a website exists

CLUSTER INTERACTION:

When the user clicks a cluster:

- Zoom into that cluster
- Use MapLibre's `getClusterExpansionZoom`
- Smoothly animate the map to the appropriate zoom level

When zooming in:
large clusters should split into smaller clusters and eventually individual company markers.

MARKER/LAYER BEHAVIOR:

Do not create hundreds of React components for markers.

Use MapLibre sources and layers for the main visualization so the implementation can scale to hundreds or thousands of companies later.

For company logos, if using HTML markers is necessary, keep the implementation efficient and explain why.

NEXT.JS:

- The map must be implemented as a client component.
- Correctly initialize MapLibre inside `useEffect`.
- Use `useRef` for the map container and map instance.
- Properly remove/destroy the MapLibre instance when the component unmounts.
- Avoid hydration errors.

PROJECT STRUCTURE:

components/
  map/
    StartupMap.tsx
    CompanyPopup.tsx

data/
  companies.ts

The main page should simply render the map.

IMPORTANT:

Do NOT implement:
- Authentication
- Database
- Prisma
- Supabase
- Search
- Filters
- Admin dashboard
- Jobs
- Payments
- Backend APIs
- User accounts

This task is ONLY the static Hyderabad company map.

VISUAL PRIORITY:

The uploaded reference image is the main visual direction.

I want:
- Minimal light basemap
- Large geographic map
- Circular company clusters
- Cluster counts
- Different cluster sizes
- Individual company logos inside circular white markers
- Smooth zooming
- Clean popups
- Modern polished appearance

Do not make a generic MapLibre demo. Make it look like a real startup-discovery product.

Before writing code, inspect the existing project structure and reuse the project's existing styling/components where appropriate. Do not unnecessarily modify unrelated files.

After implementation, explain briefly:
1. Which files you created/changed
2. How MapLibre clustering works in this implementation
3. How to run the project