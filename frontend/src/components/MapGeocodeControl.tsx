import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import api from '../utils/axiosConfig';
import { useToast } from '../contexts/ToastContext';

const GEOCODE_ZOOM = 15;
const MIN_QUERY_LEN = 3;

const MapGeocodeControl: React.FC = () => {
  const map = useMap();
  const { t } = useTranslation();
  const { showError, showInfo } = useToast();
  const [q, setQ] = useState('');
  const [pending, setPending] = useState(false);
  const container = map.getContainer();

  const runSearch = useCallback(async () => {
    const query = q.trim();
    if (query.length < MIN_QUERY_LEN) {
      showError(t('pages.map.searchTooShort'));
      return;
    }
    setPending(true);
    try {
      const { data } = await api.get<{ results: { lat: number; lon: number; display_name: string }[] }>(
        '/geocode/',
        { params: { q: query } }
      );
      const results = data.results || [];
      if (results.length === 0) {
        showInfo(t('pages.map.searchNoResults'));
        return;
      }
      const first = results[0];
      map.flyTo([first.lat, first.lon], GEOCODE_ZOOM, { duration: 0.75 });
    } catch {
      showError(t('pages.map.searchFailed'));
    } finally {
      setPending(false);
    }
  }, [q, map, showError, showInfo, t]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch();
    }
  };

  return createPortal(
    <div className="map-geocode-control" role="search" aria-label={t('pages.map.searchPlace')}>
      <input
        type="search"
        className="map-geocode-input"
        placeholder={t('pages.map.searchPlaceholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={pending}
        autoComplete="off"
        enterKeyHint="search"
      />
      <button
        type="button"
        className="map-geocode-submit btn btn-sm btn-primary"
        onClick={() => void runSearch()}
        disabled={pending}
      >
        {pending ? t('common.loading') : t('pages.map.searchButton')}
      </button>
    </div>,
    container
  );
};

export default MapGeocodeControl;
