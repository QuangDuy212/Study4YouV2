import { en } from './en';
import { vi } from './vi';
import { zh } from './zh';
import { ko } from './ko';
import { ja } from './ja';

export const translations = {
  en,
  vi,
  zh,
  ko,
  ja,
} as const;

export type TranslationKey = keyof typeof en;
