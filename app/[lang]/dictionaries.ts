const dictionaries = {
  en: () => import('@/app/dictionaries/en.json').then((module) => module.default),
  zh: () => import('@/app/dictionaries/zh.json').then((module) => module.default),
}
 
export const getDictionary = async (locale) => dictionaries[locale]()