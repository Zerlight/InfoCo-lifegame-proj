import { headers } from 'next/headers';
import { matchLocale, type AvailableLocale, type Dictionary } from '@/utils/dictionaries';
import AppClient from '../components/app-client';

async function loadDict(initialLang: AvailableLocale): Promise<Dictionary> {
  if (initialLang === 'zh') {
    const zh = await import('@/dictionaries/zh.json');
    return zh.default as Dictionary;
  }
  const en = await import('@/dictionaries/en.json');
  return en.default as Dictionary;
}

export default async function Page() {
  const hdrs = await headers();
  const accept = hdrs.get('accept-language') || '';
  const initialLang = matchLocale(accept) as AvailableLocale;
  const dict = await loadDict(initialLang);
  return <AppClient initialDict={dict} initialLang={initialLang} />;
}
