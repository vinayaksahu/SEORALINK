import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M50 5L93.3013 30V70L50 95L6.69873 70V30L50 5Z"
        stroke="#d4af37"
        strokeWidth="2"
        fill="#0d1424"
      />
      <path
        d="M50 15L79.4423 32V68L50 85L20.5577 68V32L50 15Z"
        stroke="#38bdf8"
        strokeWidth="1"
        fill="transparent"
      />
      <circle cx="50" cy="50" r="10" fill="#d4af37" />
    </svg>
  );
}
