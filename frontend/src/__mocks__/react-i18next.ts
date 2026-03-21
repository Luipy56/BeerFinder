/**
 * Manual mock for Jest when node_modules is incomplete or react-i18next fails to resolve.
 */
import React from 'react';

export const useTranslation = () => ({
  t: (key: string) => key,
  i18n: {
    changeLanguage: () => Promise.resolve(),
    language: 'en',
  },
});

export const initReactI18next = {
  type: '3rdParty' as const,
  init: () => null,
};

export const I18nextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

export default {
  useTranslation,
  initReactI18next,
  I18nextProvider,
};
