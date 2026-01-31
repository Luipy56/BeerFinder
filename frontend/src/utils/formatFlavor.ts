import type { TFunction } from 'i18next';
import type { FlavorType } from '../types/poi';

/**
 * Returns the translated label for a flavor type value (e.g. from API).
 * Use with useTranslation: getFlavorLabel(flavor_type, t)
 */
export function getFlavorLabel(flavor: FlavorType | string | undefined | null, t: TFunction): string {
  if (!flavor || typeof flavor !== 'string') {
    return t('enums.flavor.other');
  }
  const key = `enums.flavor.${flavor}` as const;
  const out = t(key);
  return out === key ? t('enums.flavor.other') : out;
}
