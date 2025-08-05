import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { SuccessBox } from '../../components/common/index.js';

export const StopUI: React.FC = () => {
  const [stopping, setStopping] = useState(true);

  useEffect(() => {
    // Simulate stopping services
    const timer = setTimeout(() => {
      setStopping(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (stopping) {
    return (
      <Text>
        <Spinner type="dots" /> Stopping Buster services...
      </Text>
    );
  }

  return <SuccessBox message="All services stopped successfully" />;
};