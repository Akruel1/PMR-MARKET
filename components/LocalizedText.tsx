'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';

interface LocalizedTextProps {
  textKey: string;
  className?: string;
}

export default function LocalizedText({ textKey, className }: LocalizedTextProps) {
  const { locale } = useLocale();
  return <span className={className}>{t(textKey, locale)}</span>;
}























