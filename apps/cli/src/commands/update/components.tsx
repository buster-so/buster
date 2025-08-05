import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ProgressBar } from '../../components/progress/ProgressBar.js';
import { ErrorBox, SuccessBox } from '../../components/common/index.js';
import type { UpdateArgs } from './types.js';

interface UpdateUIProps {
  args: UpdateArgs;
}

export const UpdateUI: React.FC<UpdateUIProps> = ({ args }) => {
  const [step, setStep] = useState<'checking' | 'downloading' | 'installing' | 'complete' | 'error'>('checking');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Checking for updates...');

  useEffect(() => {
    const runUpdate = async () => {
      // Simulate update process
      setTimeout(() => {
        if (args.check) {
          setMessage('You are on the latest version (v1.0.0)');
          setStep('complete');
          return;
        }

        setMessage('Downloading update...');
        setStep('downloading');
        
        // Simulate download progress
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setStep('installing');
              setMessage('Installing update...');
              
              setTimeout(() => {
                setMessage('Successfully updated to v1.1.0!');
                setStep('complete');
              }, 1000);
              
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }, 1500);
    };

    runUpdate();
  }, [args]);

  if (step === 'checking') {
    return (
      <Text>
        <Spinner type="dots" /> {message}
      </Text>
    );
  }

  if (step === 'downloading') {
    return (
      <ProgressBar 
        progress={progress} 
        message={message}
        showSpinner={true}
      />
    );
  }

  if (step === 'installing') {
    return (
      <Text>
        <Spinner type="dots" /> {message}
      </Text>
    );
  }

  if (step === 'complete') {
    return <SuccessBox message={message} />;
  }

  if (step === 'error') {
    return <ErrorBox error={message} />;
  }

  return null;
};