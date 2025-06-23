import { SupportedLanguages } from '@/config';

export const ACCEPTED_LANGUAGES: SupportedLanguages[] = [...Object.values(SupportedLanguages)];

export const getBrowserLanguage = (full = false) => {
  if (!navigator) return SupportedLanguages.EN;

  if (full) {
    return navigator?.language;
  }

  const browserLocale = navigator.language.split('-')[0];
  return browserLocale || navigator.languages[0] || SupportedLanguages.EN;
};

export const isAcceptedLanguage = (language: string) =>
  ACCEPTED_LANGUAGES.includes(language as SupportedLanguages);

export const getUserAcceptedLanguage = (language: string): SupportedLanguages => {
  if (isAcceptedLanguage(language)) {
    return language as SupportedLanguages;
  }
  const browserLanguage = getBrowserLanguage();
  if (isAcceptedLanguage(browserLanguage)) {
    return browserLanguage as SupportedLanguages;
  }
  return ACCEPTED_LANGUAGES[0] || SupportedLanguages.EN;
};

export const embedLanguageOptions = [
  {
    label: 'English (en)',
    value: SupportedLanguages.EN
  }
  /* {
    label: 'German (de)',
    value: SupportedLanguages.DE
  },
  {
    label: 'Italian (it)',
    value: SupportedLanguages.IT
  },
  {
    label: 'French (fr)',
    value: SupportedLanguages.FR
  },
  {
    label: 'Spanish (es)',
    value: SupportedLanguages.ES
  },
  {
    label: 'Portuguese (pt)',
    value: SupportedLanguages.PT
  },
  {
    label: 'Dutch (nl)',
    value: SupportedLanguages.NL
  },
  {
    label: 'Chinese (zh)',
    value: SupportedLanguages.ZH
  },
  {
    label: 'Japanese (ja)',
    value: SupportedLanguages.JA
  },
  {
    label: 'Korean (ko)',
    value: SupportedLanguages.KO
  },
  {
    label: 'Hindi (hi)',
    value: SupportedLanguages.HI
  },
  {
    label: 'Norwegian (no)',
    value: SupportedLanguages.NO
  },
  {
    label: 'Greek (el)',
    value: SupportedLanguages.EL
  },
  {
    label: 'Swedish (sv)',
    value: SupportedLanguages.SV
  },
  {
    label: 'Czech (cs)',
    value: SupportedLanguages.CS
  },
  {
    label: 'Arabic (ar)',
    value: SupportedLanguages.AR
  }
    */
];

export const getLanguageLabel = (language: SupportedLanguages) =>
  embedLanguageOptions.find((option) => option.value === language)?.label || language;
