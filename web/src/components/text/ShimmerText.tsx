'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { busterAppStyleConfig } from '@/styles/busterAntDStyleConfig';

const token = busterAppStyleConfig.token!;

interface ShimmerText2Props {
  text: string;
  colors?: string[];
  duration?: number;
  fontSize?: number;
}

const animate = {
  backgroundPosition: ['200% 50%', '0% 50%']
};

export const ShimmerText: React.FC<ShimmerText2Props> = React.memo(
  ({
    text,
    colors = [token.colorTextBase, token.colorTextPlaceholder],
    duration = 1.5,
    fontSize = 13
  }) => {
    if (colors.length < 2) {
      throw new Error('ShimmerText requires at least 2 colors');
    }

    const gradientColors = [...colors, colors[0]].join(', ');

    return (
      <motion.div
        style={{
          position: 'relative',
          display: 'inline-block',
          background: `linear-gradient(90deg, ${gradientColors})`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: fontSize
        }}
        animate={animate}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear'
        }}>
        {text}
      </motion.div>
    );
  }
);

ShimmerText.displayName = 'ShimmerText';
