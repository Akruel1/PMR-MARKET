import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  href?: string;
  compact?: boolean;
  useImage?: boolean;
}

export default function Logo({ href = '/', compact = false, useImage = true }: LogoProps) {
  const logoSize = compact ? 48 : 64; // Оптимальный размер для header
  
  // Hexagonal crystal icon with handshake
  const hexagonIcon = (
    <svg
      width={logoSize}
      height={logoSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform hover:scale-105 flex-shrink-0"
    >
      {/* Hexagonal crystal structure with 3D effect */}
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#34D399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="hexHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      
      {/* Outer hexagon - main structure */}
      <path
        d="M24 4 L38 12 L38 28 L24 36 L10 28 L10 12 Z"
        fill="url(#hexGradient)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
      
      {/* Inner hexagon for depth */}
      <path
        d="M24 10 L34 16 L34 24 L24 30 L14 24 L14 16 Z"
        fill="url(#hexHighlight)"
        opacity="0.6"
      />
      
      {/* Handshake icon inside */}
      <g transform="translate(24, 24)">
        {/* Left hand */}
        <path
          d="M -8 -2 L -6 -4 L -4 -2 L -4 2 L -6 4 L -8 2 Z"
          fill="white"
          opacity="0.95"
        />
        {/* Right hand */}
        <path
          d="M 8 -2 L 6 -4 L 4 -2 L 4 2 L 6 4 L 8 2 Z"
          fill="white"
          opacity="0.95"
        />
        {/* Connection/arm lines */}
        <line
          x1="-8"
          y1="0"
          x2="8"
          y2="0"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );

  const content = (
    <div className="flex items-center gap-2.5 -ml-[120px]"> {/* Сдвиг влево на 3-4 см */}
      {/* Icon - Image or SVG */}
      <div className="flex-shrink-0">
        {useImage ? (
          <Image
            src="/logo-custom.png"
            alt="PMR Market Logo"
            width={logoSize}
            height={logoSize}
            className="transition-transform hover:scale-105 object-contain w-auto h-auto"
            style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
            priority
            unoptimized
          />
        ) : (
          hexagonIcon
        )}
      </div>

      {/* Text Logo */}
      <div className="flex flex-col">
        <div className="inline-flex items-baseline gap-1.5">
          {/* PMR with gradient: blue -> cyan -> teal */}
          <span className={`font-bold uppercase tracking-wider ${compact ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
            <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              PMR
            </span>
          </span>
          {/* MARKET in white */}
          <span className={`font-bold uppercase tracking-wider ${compact ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'} text-white`}>
            MARKET
          </span>
        </div>
        {!compact && (
          <span className="mt-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-[0.15em] text-neutral-300">
            CONNECT. SECURE. NOTIFY.
          </span>
        )}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link 
      href={href} 
      className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  );
}
