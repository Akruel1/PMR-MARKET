import Link from 'next/link';

interface LogoProps {
  href?: string;
  compact?: boolean;
}

export default function Logo({ href = '/', compact = false }: LogoProps) {
  const content = (
    <div className="flex flex-col">
      <div className="inline-flex items-baseline gap-1.5">
        <span className="text-2xl font-bold uppercase tracking-wider sm:text-3xl md:text-4xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          PMR
        </span>
        <span className="text-2xl font-bold uppercase tracking-wider sm:text-3xl md:text-4xl text-red-500">
          MARKET
        </span>
      </div>
      {!compact && (
        <span className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-neutral-400 sm:text-sm">
          CONNECT. SECURE. NOTIFY.
        </span>
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
      {content}
    </Link>
  );
}


