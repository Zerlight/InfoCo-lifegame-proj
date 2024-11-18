import en from "@/app/dictionaries/en.json";

const dictionaries = {
  en: () =>
    import("@/app/dictionaries/en.json").then((module) => module.default),
  zh: () =>
    import("@/app/dictionaries/zh.json").then((module) => module.default),
};

export type AvailableLocales = keyof typeof dictionaries;

export type Dictionary = typeof en;

export const getDictionary = async (locale: AvailableLocales) =>
  dictionaries[locale]();
  
export const matchLocale = (locale: string): AvailableLocales => {
  if (locale.includes("zh")) return "zh";
  return "en";
};
