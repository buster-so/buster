import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Table from 'ink-table';
import { ErrorBox, SuccessBox } from '../../components/common/index.js';
import type { StartArgs, ServiceStatus } from './types.js';

interface StartUIProps {
  args: StartArgs;
}

const SERVICES: ServiceStatus[] = [
  { name: 'API Server', status: 'starting', port: 3000 },
  { name: 'Database', status: 'starting', port: 5432 },
  { name: 'Cache', status: 'starting', port: 6379 },
];

export const StartUI: React.FC<StartUIProps> = ({ args }) => {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const [allStarted, setAllStarted] = useState(false);

  useEffect(() => {
    // Simulate services starting up
    const timers = services.map((service, index) => {
      return setTimeout(() => {
        setServices(prev => 
          prev.map((s, i) => 
            i === index ? { ...s, status: 'running' } : s
          )
        );
      }, (index + 1) * 1000);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const allRunning = services.every(s => s.status === 'running');
    if (allRunning && !allStarted) {
      setAllStarted(true);
    }
  }, [services, allStarted]);

  const tableData = services.map(service => ({
    Service: service.name,
    Status: service.status === 'running' 
      ? `✓ ${service.status}` 
      : `${service.status}...`,
    Port: service.port?.toString() || '-',
  }));

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Starting Buster Services{args.detached ? ' (detached mode)' : ''}...</Text>
      
      <Table data={tableData} />
      
      {!allStarted && (
        <Text>
          <Spinner type="dots" /> Starting services...
        </Text>
      )}
      
      {allStarted && (
        <SuccessBox message="All services started successfully!" />
      )}
      
      {args.detached && allStarted && (
        <Text dimColor>Services running in background. Use 'buster stop' to stop them.</Text>
      )}
    </Box>
  );
};