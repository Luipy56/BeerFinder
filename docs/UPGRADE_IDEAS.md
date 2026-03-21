# BeerFinder — upgrade ideas & roadmap

This document collects upgrade ideas for **BeerFinder**: your stated priorities, gaps relative to the current codebase, and patterns inspired by beer/venue apps and open map/POI conventions. Use it to open issues or `tasks/*.json` entries; nothing here is a commitment to build everything.

---

## How this maps to the codebase today

| Area | Where it lives | What exists now |
|------|----------------|-----------------|
| Map | `frontend/src/components/MapComponent.tsx` | Leaflet `MapContainer`, OSM `TileLayer`, `DEFAULT_ZOOM = 6`, `POI_ZOOM = 13`, click-to-create flow, `SESSION_KEY_LAST_MAP` for last POI view, one-shot `navigator.geolocation` on mount (raises zoom to at least 13 if lower). No explicit `maxZoom`/`minZoom`, no “locate me at max zoom” button, no marker clustering. |
| POI model | `backend/api/models.py` (`POI`, `POIItem`) | `name`, `description`, `location` (PostGIS `PointField`), `thumbnail`, `created_by` / `last_updated_by`, timestamps; M2M `items` through `POIItem` with `local_price`. **No** opening hours, venue type, or amenities. |
| Create / edit POI UI | `frontend/src/components/CreatePOIModal.tsx`, `EditPOIModal.tsx` | Create uses map click coordinates. Edit updates name, description, thumbnail; `handleEditPOI` in `MapComponent.tsx` does **not** change coordinates (by design). |
| View / permissions | `MapComponent.tsx` → `ViewPOIModal` | `canEdit` / `canDelete`: admin **or** POI creator only. |
| Docs vs product | `README.md` | README states users can “edit any existing POI”; the UI currently restricts edits. **Product decision:** align README, API rules, and UI (either open editing with audit/revert, or documented ownership model). |

---

## 1. Vision and principles

- **Crowd-sourced truth:** many eyes on venues and menus; design for incorrect or stale data, not only happy paths.
- **Mobile-first map:** thumb reach, large tap targets, clear locate/create affordances, tolerable behavior when GPS is coarse or denied.
- **Trust in layers:** anonymous browse vs authenticated edit; optional verification, reporting, and history for sensitive fields (hours, location).
- **Beer-specific value:** go beyond “generic map pins” with items, prices at POI, and (later) availability signals—without over-promising accuracy.

---

## 2. Your priority themes (expanded)

### 2.1 Ultra zoom on the map

**Intent:** Let users place and inspect POIs at building or entrance scale.

**Technical notes:**

- Leaflet: set `maxZoom` on `MapContainer` and matching `maxZoom` on `TileLayer` to what the **tile provider** actually serves. Default OSM tiles are usable to about zoom 19; going higher requires overzoom (stretch) or a different provider.
- Optional: zoom slider control, scroll-wheel tuning, mobile double-tap zoom conventions.
- **Definition of done (example):** map allows maximum detail supported by tiles without broken gray tiles; POI creation still works at that zoom; performance remains acceptable on mid-range phones.

**Code touchpoints:** `frontend/src/components/MapComponent.tsx`, `MapComponent.css` if controls are added.

---

### 2.2 “Big zoom to my position” + easy new POI

**Intent:** One control that centers the map on the user with **high** zoom (e.g. 17–19) so dropping a pin matches reality; optionally streamline opening the create modal.

**UX patterns:**

- Floating action or toolbar: “Locate & add” vs separate “Locate” + “Add at center.”
- Flow A: button → `getCurrentPosition` / short `watchPosition` → `map.flyTo(latlng, maxZoom)` → user taps map once to set exact pin → `CreatePOIModal` (current pattern).
- Flow B: button → fly to user → immediately open create modal prefilled with current center (user can cancel or nudge map before submit).
- Handle errors: permission denied, timeout, low accuracy—show toast and fallback.

**Definition of done (example):** authenticated user can, in two taps or fewer from the map, be zoomed tightly on GPS position and start POI creation with sensible default coordinates.

**Code touchpoints:** `MapComponent.tsx` (map ref / `useMap` helper component), reuse toast patterns from `ToastContext`.

---

### 2.3 Edit POIs: opening hours / shifts

**Intent:** Shops have schedules; show and edit when a venue is open (including split shifts, e.g. closed afternoon).

**Data model options:**

1. **Simple structured JSON** (recommended first iteration): e.g. seven days, each with list of `{ open, close }` intervals in local time, plus optional `timezone` or “use browser TZ” disclaimer.
2. **Single text field** mirroring [OSM `opening_hours`](https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification): powerful but hard for casual editors; good for import/export with OSM-minded users.
3. **Hybrid:** structured editor in UI + generated OSM string for power users/API consumers.

**API / backend:** migration on `beerfinder_poi`, serializer fields, validation (no overlapping intervals per day unless intentional), optional “last verified at” for hours.

**Frontend:** `EditPOIModal` + `ViewPOIModal` / popups: weekly grid or template presets (“Bar typical”), “closed today”, seasonal exceptions (later). **“Open now”** badge using client-side evaluation from structured hours + user or venue TZ.

**Definition of done (example):** POI can store weekly hours; edit and display in UI; map popup or detail view shows open/closed state for “now.”

**Code touchpoints:** `backend/api/models.py`, `serializers.py`, `views.py`; `frontend/src/types/poi.ts`, `poiService.ts`, `EditPOIModal.tsx`, `ViewPOIModal.tsx` / `ViewPOIDetailsModal.tsx`.

---

## 3. Map and location UX (OSM-style and general map apps)

- **Persistent locate control:** re-center anytime, not only on first load (contrast: current one-shot geolocation in `useEffect` in `MapComponent.tsx`).
- **Compass / heading:** optional map rotation on supported devices (lower priority).
- **Viewport persistence:** extend beyond `SESSION_KEY_LAST_MAP` (e.g. last bbox + zoom for anonymous return visits).
- **Marker clustering:** `leaflet.markercluster` or similar at low zoom; spiderfy overlapping venues in dense areas.
- **Search / geocode:** Nominatim (respect [usage policy](https://operations.osmfoundation.org/policies/nominatim/)) or a dedicated geocoder; jump map to query result. *Implemented:* backend proxy `GET /api/v1/geocode/?q=` (`api/geocode_views.py`) with `NOMINATIM_USER_AGENT` in settings and short `LocMem` cache; frontend `MapGeocodeControl` on the map.
- **Layers:** optional satellite or contrast basemap toggle.
- **PWA / offline:** cache shell; true offline tiles are heavy—usually out of scope until core UX is solid.

---

## 4. POI and venue depth (beer / venue app patterns)

*Inspiration: venue-centric apps emphasize verification, menus, and discovery radius—not proprietary features to clone.*

- **Venue type:** bar, brewery, brewpub, bottle shop, restaurant_with_beer, etc.
- **Amenities:** terrace, food, pets, wheelchair access, cards/cash, noise level.
- **Verification:** “verified venue” flag (admin) or “last confirmed by community” date.
- **Report / flag:** wrong location, closed permanently, duplicate POI.
- **Media:** multiple photos per POI (gallery), not only `thumbnail` on `POI`.
- **External links:** website, Instagram, phone (watch spam/abuse).

---

## 5. Beer and inventory (build on `Item` + `POIItem`)

You already have `Item`, `POIItem`, and `local_price` in `backend/api/models.py`.

- **Menu / tap list:** ordered list of items at POI; “on tap now” vs “sometimes has.”
- **Rotation / freshness:** “last updated” per POI–item link; optional editor note.
- **Happy hour / pricing rules:** time-bounded price overrides (pairs well with opening hours).
- **External identifiers:** optional fields for UPC or other IDs—only with clear licensing and data policy.
- **Price history:** optional append-only log for analytics (privacy and storage tradeoffs).

---

## 6. Social and engagement (large scope — mark as later)

- User favorites and saved lists.
- Shareable URLs: `?poi=123` or bbox hash for “this view.”
- Simple routes or “tour” ordering between selected POIs (export to Google Maps / OSM directions is lighter than building a router).
- Comments or ratings (moderation burden—usually P2).

---

## 7. Trust, safety, and governance

- **Align permissions:** README “anyone can edit” vs `canEdit` / `canDelete` in `MapComponent.tsx`—pick one model and enforce in the API (not only UI).
- **Audit log:** who changed what on POI (especially hours and location if ever editable).
- **Rate limiting:** POI create/update and geocode endpoints.
- **Spam:** CAPTCHA or throttling for new accounts; admin tools for bulk revert.

---

## 8. Technical hardening

- **Tests:** extend `tests/frontend/MapComponent.test.tsx` and `poiService.test.ts` for new map controls and serializers.
- **API versioning:** if mobile clients or public API appear, version breaking schema changes (`/api/v2/`).
- **Geo performance:** bbox queries, pagination, or vector tiles if POI count grows large.
- **Caching:** CDN for static assets; short-lived cache for POI list GeoJSON where safe.
- **i18n:** new strings in `frontend/public/locales/en/translation.json` and `es/translation.json` for hours UI and map controls.

---

## 9. Prioritized backlog

| Priority | Theme | Definition of done (one line each) |
|----------|--------|-------------------------------------|
| **P0** | Ultra zoom | Map uses tile-consistent `maxZoom` / optional overzoom; create flow works at max detail. |
| **P0** | Locate + zoom for POI | Dedicated control flies to user at high zoom; clear error handling if GPS fails. |
| **P0** | Opening hours | DB + API + edit/view UI + “open now” derived state on detail or popup. |
| **P1** | Map UX | Locate control anytime; marker clustering; address search. |
| **P1** | Permissions story | README, API, and UI agree; optional audit fields on POI updates. |
| **P1** | Venue metadata | Type + a few amenities; report wrong info. |
| **P2** | Inventory depth | Tap list, rotation signals, happy hour flags. |
| **P2** | Social / share | Deep links, favorites, export route. |
| **P2** | PWA polish | Installable shell, basic offline shell (not full tiles). |

---

## 10. References

- [OpenStreetMap Key:opening_hours specification](https://wiki.openstreetmap.org/wiki/Key:opening_hours/specification) — expressive hours syntax; optional advanced export.
- [Leaflet reference — Map options](https://leafletjs.com/reference.html#map-option) — `maxZoom`, `minZoom`, `flyTo`.
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) — if using OSM’s search API.
- [Untappd Help — How to use the Find It feature](https://help.untappd.com/hc/en-us/articles/360040808131--How-to-use-the-Find-It-feature) — example of “where is this beer” / venue radius thinking (product pattern only).
- [JOSM OpeningHoursEditor](https://wiki.openstreetmap.org/wiki/JOSM/Plugins/OpeningHoursEditor) — inspiration for complex hours UI (desktop-oriented; simplify for web).

---

## Appendix: quick win checklist (optional first sprint)

1. Add explicit `maxZoom` / `minZoom` on map + tile layer in `MapComponent.tsx`.
2. Add “Locate” button with `flyTo` at zoom 18–19 and permission messaging.
3. Add migration `opening_hours` (JSONField or TextField) + minimal weekly editor in `EditPOIModal`.
4. Fix README or UI to match the real edit policy.

---

*Document generated to support planning; revise priorities as you ship.*
