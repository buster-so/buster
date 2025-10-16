import { Text } from 'ink';
import { useEffect, useState } from 'react';

interface SpinnerProps {
  label?: string;
  type?: 'dots' | 'line' | 'arc';
}

const spinners = {
  dots: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  line: {
    frames: ['-', '\\', '|', '/'],
    interval: 100,
  },
  arc: {
    frames: ['◜', '◠', '◝', '◞', '◡', '◟'],
    interval: 100,
  },
};

/**
 * Animated spinner component for loading states
 */
export function Spinner({ label = 'Loading', type = 'dots' }: SpinnerProps) {
  const [frame, setFrame] = useState(0);
  const spinner = spinners[type];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % spinner.frames.length);
    }, spinner.interval);

    return () => clearInterval(timer);
  }, [spinner]);

  return (
    <Text color="cyan">
      {spinner.frames[frame]} {label}
    </Text>
  );
}
