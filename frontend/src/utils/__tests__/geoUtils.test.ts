import { haversineDistanceKm, formatDistanceFromKm } from '../geoUtils';

describe('geoUtils', () => {
  describe('haversineDistanceKm', () => {
    it('returns ~0 for identical points', () => {
      expect(haversineDistanceKm(40.4, -3.7, 40.4, -3.7)).toBeLessThan(0.001);
    });

    it('returns plausible Madrid–Barcelona distance (~500 km)', () => {
      const mad = { lat: 40.4168, lon: -3.7038 };
      const bcn = { lat: 41.3874, lon: 2.1686 };
      const km = haversineDistanceKm(mad.lat, mad.lon, bcn.lat, bcn.lon);
      expect(km).toBeGreaterThan(480);
      expect(km).toBeLessThan(520);
    });
  });

  describe('formatDistanceFromKm', () => {
    it('formats meters under 1 km', () => {
      expect(formatDistanceFromKm(0.4)).toBe('400 m');
    });

    it('formats one decimal for 1–10 km', () => {
      expect(formatDistanceFromKm(2.56)).toBe('2.6 km');
    });

    it('rounds at 10+ km', () => {
      expect(formatDistanceFromKm(42.3)).toBe('42 km');
    });
  });
});
