const dictionaries = {
  en: () =>
    import("@/app/dictionaries/en.json").then((module) => module.default),
  zh: () =>
    import("@/app/dictionaries/zh.json").then((module) => module.default),
};

export type availableLocales = keyof typeof dictionaries;

export const getDictionary = async (locale: availableLocales) =>
  dictionaries[locale]();

export const matchLocale = (locale: string) => {
  if (locale.includes("zh")) return "zh";
  return "en";
};
