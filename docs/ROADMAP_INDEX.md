# BeerFinder — índice de planes y documentación de roadmap

Usa este archivo como **mapa** de todos los planes del proyecto. Cada documento tiene un propósito distinto; no duplican el mismo nivel de detalle.

| Documento | Enfoque | Cuándo leerlo |
|-----------|---------|----------------|
| [`UPGRADE_IDEAS.md`](./UPGRADE_IDEAS.md) | Visión, principios, gaps vs código actual | Alinear producto y arquitectura |
| [`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md) | **F01–F20**: fichas con criterios de aceptación y orden de implementación | Entregar features una a una |
| [`FEATURES_WAVE2_INTERNET.md`](./FEATURES_WAVE2_INTERNET.md) | Ideas de mercado + F04/F05 concretos; enlaces externos | Inspiración y trazabilidad |
| [`PLAN_WAVE3_GROWTH.md`](./PLAN_WAVE3_GROWTH.md) | **G01+**: crecimiento, confianza, comunidad, monetización ligera | Después de cerrar la mayoría de F06–F20 |
| [`PLAN_ENGINEERING.md`](./PLAN_ENGINEERING.md) | Calidad, API, rendimiento, seguridad, CI/CD | Paralelo a features; antes de escalar tráfico |
| [`COMPETITOR_FEATURES.md`](./COMPETITOR_FEATURES.md) | Paridad vs apps competidoras (mapa, distancia, share, dark map) | Revisar tras cambios de mapa/POI |
| Reglas Cursor | [`.cursor/rules/post-implementation-verify.mdc`](../.cursor/rules/post-implementation-verify.mdc) | Tras cada cambio: ejecutar y probar |

## Orden sugerido de lectura para un nuevo desarrollador

1. `UPGRADE_IDEAS.md` (contexto)  
2. `PLAN_20_FEATURES.md` (qué construir primero)  
3. `FEATURES_WAVE2_INTERNET.md` (qué ya se inspiró en la web)  
4. `PLAN_ENGINEERING.md` (cómo mantener el repo sano)  
5. `PLAN_WAVE3_GROWTH.md` (siguiente ola de producto)

## Convención de ramas (recomendada)

- Features numeradas del plan principal: `feature/F07-horarios`  
- Wave 2/3: `feature/wave3-G05-audit-log`  
- Ingeniería: `chore/eng-api-pagination` o `fix/eng-error-boundary`

Actualiza este índice si añades un nuevo archivo `docs/PLAN_*.md`.
