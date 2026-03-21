# Plan de ingeniería — calidad, rendimiento y operaciones

Complementa los planes de **producto** ([`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md), [`PLAN_WAVE3_GROWTH.md`](./PLAN_WAVE3_GROWTH.md)). Aquí el foco es **cómo** se construye y se opera BeerFinder.

---

## A. Tests y CI

| ID | Tarea | Criterio de hecho |
|----|--------|-------------------|
| E01 | Pipeline CI (GitHub Actions / GitLab) | `pytest` backend + `npm test` frontend en cada PR |
| E02 | Cobertura mínima en servicios críticos | `poiService`, serializers POI, geocode proxy |
| E03 | Test E2E smoke (Playwright/Cypress) opcional | Login + abrir mapa + listar POIs |
| E04 | Contract tests API | OpenAPI schema generado vs respuestas reales |

## B. API y backend Django

| ID | Tarea | Criterio de hecho |
|----|--------|-------------------|
| E05 | Paginación consistente en listados GeoJSON | Documentar `page`/`page_size`; no cargar miles de features de golpe |
| E06 | Filtros bbox en `GET /pois/` | Query params `south,west,north,east` con validación |
| E07 | Rate limiting global + por usuario autenticado | DRF throttling o reverse proxy |
| E08 | Versión API `/api/v2/` cuando haya breaking changes | Deprecation header en v1 |
| E09 | Health detallado | `/health/` + check DB opcional (sin filtrar secretos) |

## C. Frontend React

| ID | Tarea | Criterio de hecho |
|----|--------|-------------------|
| E10 | Error boundary en rutas | Fallo en una página no tumba toda la app |
| E11 | Estados vacíos y de error coherentes | Mapa, listas, modales |
| E12 | Accesibilidad mapa + modales | Foco atrapado, `aria-*`, contraste |
| E13 | Bundle analysis | Identificar dependencias pesadas; lazy routes si aplica |
| E14 | Variables de entorno documentadas | `REACT_APP_*`, `NOMINATIM_USER_AGENT` |

## D. Datos, imágenes y privacidad

| ID | Tarea | Criterio de hecho |
|----|--------|-------------------|
| E15 | Límite tamaño/cantidad de thumbnails | Validación backend + mensaje claro |
| E16 | Política de retención y export user data | GDPR-style checklist en `legal.md` |
| E17 | Backups automatizados BD | Documentado en despliegue; no en repo |

## E. Observabilidad y despliegue

| ID | Tarea | Criterio de hecho |
|----|--------|-------------------|
| E18 | Logging estructurado (JSON) en backend | Request id opcional |
| E19 | Métricas básicas (latencia p95 API) | Prometheus/OpenTelemetry o logs agregados |
| E20 | Documento runbook | Reinicio, migraciones, rollback imagen Docker |

---

## Orden recomendado (primer sprint de ingeniería)

1. **E10** (resiliencia UX)  
2. **E05** / **E06** (escala de POIs en mapa)  
3. **E01** (CI)  
4. **E07** (abuso / coste Nominatim y APIs)  
5. **E12** (a11y incremental)

## Referencias cruzadas

- Geocodificación y política Nominatim: [`UPGRADE_IDEAS.md`](./UPGRADE_IDEAS.md), [`FEATURES_WAVE2_INTERNET.md`](./FEATURES_WAVE2_INTERNET.md)  
- Verificación manual tras cambios: [`.cursor/rules/post-implementation-verify.mdc`](../.cursor/rules/post-implementation-verify.mdc)
