'use client';

import React from 'react';
import { cn } from '@/lib/classMerge';
import styles from './BusterLoadingStyles.module.css';

import { useEffect, useRef, useState } from 'react';

interface BusterLoadingLogoProps {
  className?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  isLoading?: boolean;
  style?: React.CSSProperties;
}

// Original complete path from your SVG
const completePath =
  'M264.686 278.576L168.362 372.185C146.752 393.23 146.752 427.353 168.362 448.398C189.972 469.444 225.008 469.444 246.618 448.398L380.793 318.119M264.686 278.576L302.535 318.12C324.145 339.165 359.183 339.165 380.793 318.119M264.686 278.576L218.076 229.924M380.793 318.119C402.403 297.074 402.402 262.952 380.792 241.906L253.311 117.754C274.921 138.799 275.586 174.587 253.976 195.633L116.159 327.272M116.159 327.272C126.352 317.497 132.672 303.902 132.672 288.87V171.366M116.159 327.272C106.17 336.85 92.4618 342.761 77.336 342.761C46.7747 342.761 22 318.632 22 288.87V74.8906C22 45.1275 46.7747 21 77.336 21C107.897 21 132.671 45.1279 132.671 74.891L132.672 171.366M253.312 117.754C231.702 96.7079 197.331 98.3731 175.721 119.419M175.721 119.419L132.672 171.366M175.721 119.419C158.534 140.158 156.205 142.969 132.672 171.366';

export const BusterLoadingLogo = React.memo(function LogoLoadingAnimation({
  className,
  backgroundColor = '#E0E0E0',
  foregroundColor = 'black',
  isLoading = true,
  style
}: BusterLoadingLogoProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(2500); // fallback value

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(Math.ceil(length));
    }
  }, []);

  return (
    <svg
      style={style}
      width="486"
      height="486"
      viewBox="0 0 375 486"
      className={cn('relative h-full w-full', className)}>
      {/* Hidden reference path to measure length */}
      <path
        ref={pathRef}
        d={completePath}
        stroke="transparent"
        strokeWidth="41.2322"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ visibility: 'hidden', position: 'absolute' }}
      />

      {/* Static background path */}
      <path
        d={completePath}
        stroke={backgroundColor}
        strokeWidth="41.2322"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Foreground path - animated if loading, static if not */}
      <path
        d={completePath}
        stroke={foregroundColor}
        strokeWidth="41.2322"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isLoading ? styles.animatedPath : styles.staticPath}
        style={
          isLoading
            ? ({
                '--path-length': pathLength,
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength
              } as React.CSSProperties & { '--path-length': number })
            : undefined
        }
      />
    </svg>
  );
});

BusterLoadingLogo.displayName = 'BusterLoadingLogo';

export default BusterLoadingLogo;
