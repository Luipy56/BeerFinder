import L from 'leaflet';
import { POI } from '../types/poi';

export type MapMarkerItem =
  | { type: 'poi'; poi: POI }
  | { type: 'cluster'; pois: POI[]; lat: number; lng: number };

/** Grid-based clustering at low zoom (no leaflet.markercluster dependency). */
export function buildMapMarkers(pois: POI[], zoom: number): MapMarkerItem[] {
  const valid = pois.filter(
    (p): p is POI & { latitude: number; longitude: number } =>
      p.latitude != null && p.longitude != null && !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude)
  );
  if (zoom >= 12 || valid.length === 0) {
    return valid.map((poi) => ({ type: 'poi', poi }));
  }
  const step =
    zoom <= 6 ? 2.0 : zoom <= 7 ? 1.0 : zoom <= 8 ? 0.5 : zoom <= 9 ? 0.2 : zoom <= 10 ? 0.05 : 0.02;
  const groups = new Map<string, (POI & { latitude: number; longitude: number })[]>();
  for (const poi of valid) {
    const gx = Math.floor(poi.latitude / step);
    const gy = Math.floor(poi.longitude / step);
    const key = `${gx},${gy}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(poi);
  }
  const out: MapMarkerItem[] = [];
  for (const list of groups.values()) {
    if (list.length === 1) {
      out.push({ type: 'poi', poi: list[0] });
    } else {
      const lat = list.reduce((s, p) => s + p.latitude, 0) / list.length;
      const lng = list.reduce((s, p) => s + p.longitude, 0) / list.length;
      out.push({ type: 'cluster', pois: list, lat, lng });
    }
  }
  return out;
}

export function clusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: 'map-cluster-marker',
    html: `<span class="map-cluster-marker-count">${count}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}
