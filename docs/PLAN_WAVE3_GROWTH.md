# Plan Wave 3 — crecimiento, confianza y comunidad

**Prerrequisitos recomendados:** buena parte de [`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md) (F06–F16) y estabilidad del mapa ([`FEATURES_WAVE2_INTERNET.md`](./FEATURES_WAVE2_INTERNET.md)).

Este plan describe **producto y datos** en fases posteriores a F20. No sustituye las fichas F01–F20; amplía el horizonte.

---

## Fase G — Confianza y gobierno de datos

| ID | Feature | Objetivo | Notas |
|----|---------|----------|--------|
| G01 | Historial de cambios en POI | Quién cambió qué y cuándo (horas, nombre, ubicación si se permite) | Tabla `POIRevision` o log genérico |
| G02 | Alinear README ↔ API ↔ UI en permisos de edición | Una sola regla documentada | Ver `UPGRADE_IDEAS.md` |
| G03 | Roles: moderador | Revisar reportes sin ser superuser Django | Grupo `moderators` + permisos DRF |
| G04 | Límites por usuario | Creación masiva de POIs / spam | Throttling DRF + señales |
| G05 | “Última verificación” en POI | Fecha en que alguien confirmó datos | Campo + botón “Confirmo que sigue vigente” |

## Fase H — Descubrimiento y retención

| ID | Feature | Objetivo | Notas |
|----|---------|----------|--------|
| G06 | Notificaciones in-app (sin push) | “Nuevo ítem en tu POI favorito” | Centro de notificaciones simple |
| G07 | Listas públicas curadas | “Ruta del vermouth”, “Cervezas artesanales en X” | Modelo `Collection` + M2M POI |
| G08 | Eventos en local | Cata, música en vivo | `POIEvent` con ventana temporal |
| G09 | Comparar dos POIs | Tabla lado a lado (horas, rating, estilos) | Solo frontend + datos ya expuestos |
| G10 | Feed / actividad reciente | Últimos POIs o reseñas (opt-in privacidad) | Paginación + anonimización |

## Fase I — Contenido enriquecido

| ID | Feature | Objetivo | Notas |
|----|---------|----------|--------|
| G11 | Enlaces externos | Web, redes, teléfono con validación | Campos en `POI`, sanitizar URLs |
| G12 | Menú / carta PDF o URL | Enlace a PDF menú | Campo opcional |
| G13 | Etiquetas libres + sugeridas | #ipa #terraza | Tabla tags o JSON controlado |
| G14 | Idioma del local | Metadato para horarios/TZ | Par con F07 |

## Fase J — Expansión (opcional / largo plazo)

| ID | Feature | Objetivo | Notas |
|----|---------|----------|--------|
| G15 | API pública read-only | Clave de API para partners | Rate limit agresivo |
| G16 | Import desde fuentes abiertas | OSM / datasets con licencia compatible | Pipeline ETL + deduplicación |
| G17 | App móvil nativa | Mejor GPS y cámara | Fuera de alcance web corto plazo |

---

## Priorización sugerida

1. **G02** (rápido, reduce confusión)  
2. **G05** + **G01** (datos creíbles)  
3. **G04** (antes de abrir registro público amplio)  
4. **G07** + **G11** (engagement sin complejidad técnica extrema)  
5. Resto según métricas de uso

## Verificación

Misma regla que el plan principal: tras cada entrega, rutas y APIs sin regresiones 500/404 en lo tocado, tests donde existan cobertura.
