# Competencia — funciones habituales y paridad en BeerFinder

Resumen de patrones públicos en apps y sitios de **cervecerías / mapas POI** (Finding Beer, BreweryMap, hopyard, brewFinder, localizadores genéricos) y cómo los cubre el proyecto.

| Patrón competidor | En BeerFinder |
|-------------------|----------------|
| Mapa con pins / clusters | Mapa Leaflet, clustering por rejilla (zoom bajo), zoom OSM/Carto |
| Cerca de mí / distancia | Geolocalización al cargar; **distancia** en popup del mapa y en ficha POI (Haversine) |
| Buscar por ciudad o dirección | Barra de búsqueda + proxy Nominatim (`/api/v1/geocode/`) |
| Compartir local | **Web Share API** en ficha + copiar enlace; deep link `/?poi=id` |
| Lista / detalle | `POIsPage`, modales de vista/edición |
| Mapa oscuro / contraste | Conmutador **Standard** (OSM) / **Dark** (Carto Dark), persistido en `localStorage` |
| Valoraciones, wishlist, visitas | Planificados en [`PLAN_20_FEATURES.md`](./PLAN_20_FEATURES.md) (F09–F14) |

**No replicado (a propósito o pendiente):** UPC, app nativa, push, motor de rutas propio, email export (ver [`PLAN_WAVE3_GROWTH.md`](./PLAN_WAVE3_GROWTH.md)).

Políticas: teselas Carto/OSM y Nominatim deben usarse según sus términos y límites de uso.
