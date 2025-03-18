import en from "@/dictionaries/en.json";

const dictionaries = {
  en: () =>
    import("@/dictionaries/en.json").then((module) => module.default),
  zh: () =>
    import("@/dictionaries/zh.json").then((module) => module.default),
};

export type AvailableLocale = keyof typeof dictionaries;

export type Dictionary = typeof en;

export const getDictionary = async (locale: AvailableLocale) =>
  dictionaries[locale]();
  
export const matchLocale = (locale: string): AvailableLocale => {
  if (locale.includes("zh")) return "zh";
  return "en";
};
