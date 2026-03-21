# Wave 2 — Internet-inspired feature backlog

Ideas distilled from public product descriptions and industry patterns (not proprietary implementations). Mapped to the existing roadmap in [`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md) (F04–F20).

**Nominatim:** always respect [Usage policy (Nominatim)](https://operations.osmfoundation.org/policies/nominatim/) — identify the app, throttle requests, prefer server-side proxy for production traffic.

## Reference links (patterns)

| Source | URL | Pattern borrowed |
|--------|-----|------------------|
| Finding Beer | https://finding.beer/ | Map discovery, regional lists, style signals at venues |
| BreweryDB (press) | https://www.brewbound.com/news/brewerydb-the-app-for-the-beer-adventurer | Filters (seating, menu types, pet/family), custom routes |
| BreweryMap | https://brewerymap.andro.io/ | Wishlist, visit logging, road-trip framing |
| Find Craft Beer (App Store) | https://apps.apple.com/us/app/find-craft-beer/id340206461 | Near-me / radius style discovery |
| Storemapper checklist | https://www.storemapper.com/blog/checklist-features-store-locator-app | Search, hours, mobile, analytics |
| Nominatim policy | https://operations.osmfoundation.org/policies/nominatim/ | Geocoding usage rules |

## Shipped in repo (Wave 1 / plan F01–F03 + UX)

| Plan ID | Feature | Code / notes |
|---------|---------|----------------|
| F01 | Zoom 3–19 (OSM-aligned) | `MapComponent.tsx` |
| F02 | Locate + zoom 18 | `MapLocateControl` |
| F03 | `/?poi=<id>` deep link | `useSearchParams` + `getPOIById` |
| — | Open on map from POI list | `POIsPage.tsx` |
| — | Copy shareable map URL | `ViewPOIModal.tsx` |

## 22 Wave 2 ideas (backlog rows)

| # | Feature | Plan ref | Notes |
|---|---------|----------|--------|
| 1 | Marker clustering | F04 | Dense pins; spiderfy for `?poi=` |
| 2 | Place / address search | F05 | Backend proxy to Nominatim recommended |
| 3 | Radius “within X km” | — (post-F05) | PostGIS or haversine |
| 4 | Sort by distance | — | Same center as radius |
| 5 | Venue category taxonomy | F06 | Brewpub, bar, bottle shop, … |
| 6 | Opening hours | F07 | JSON weekly; OSM string optional |
| 7 | Open now | F08 | Depends on F07 |
| 8 | Amenity flags | F11 | Pets, food, terrace, … |
| 9 | Favorites | F09 | Per-user |
| 10 | Ratings | F10 | One vote per user rule |
| 11 | Visit log + notes | F14 | Private notes |
| 12 | Beer styles at venue | F12 | From `Item` / `flavor_type` |
| 13 | Lists by region / bbox | F13 | Sort by rating or name |
| 14 | Multi-stop tour + external nav | F15 | OSM / Google waypoints |
| 15 | Report POI | F16 | Closed, duplicate, wrong pin |
| 16 | Photo gallery | F17 | Multiple images |
| 17 | CSV import | F18 | Admin |
| 18 | View analytics | F19 | Admin aggregates |
| 19 | PWA shell | F20 | Manifest + SW |
| 20 | Web Share API | — | Mobile share sheet |
| 21 | Dark basemap toggle | — | e.g. Carto Dark alongside OSM |
| 22 | “Near me” side panel | — | List synced to bbox / center |

## Implemented in Wave 2 code pass

| ID | Status | Implementation |
|----|--------|----------------|
| F04 | Done | Grid clustering (zoom &lt; 12) in `frontend/src/utils/mapClustering.ts` + `MapZoomTracker` in `MapComponent` (no extra npm package) |
| F05 | Done | `GET /api/v1/geocode/?q=` in `backend/api/geocode_views.py` + `MapGeocodeControl.tsx` |

See [`UPGRADE_IDEAS.md`](./UPGRADE_IDEAS.md) for philosophy and [`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md) for per-feature acceptance templates.
