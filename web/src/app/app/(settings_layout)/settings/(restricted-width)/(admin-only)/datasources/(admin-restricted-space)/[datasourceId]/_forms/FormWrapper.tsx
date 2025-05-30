'use client';

import type React from 'react';
import { WhiteListBlock } from './WhiteListBlock';

 
// Define a more specific but limited interface for our form
// This avoids the deep type recursion while maintaining safety
export interface BusterFormApi {
  handleSubmit: () => void;
  reset: () => void;
  state: {
    canSubmit: boolean;
    isSubmitting: boolean;
    isDirty: boolean;
  };
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I am just using any here because it was a pain to type this out
  AppField: any;
  SubscribeButton: React.ComponentType<{
    submitLabel: string;
    disableIfNotChanged?: boolean;
    useResetButton?: boolean;
  }>;
}

// Use a typed approach for the form
export interface FormWrapperProps {
  children: React.ReactNode;
  flow: 'create' | 'update';
  form: BusterFormApi;
}

export function FormWrapper({ form, children, flow }: FormWrapperProps) {
  return (
    <form
      className="[&_.label-wrapper]:border-b-border flex flex-col space-y-4 [&_.label-wrapper]:border-b [&_.label-wrapper]:pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}>
      {children}

      <WhiteListBlock />

      <form.AppForm>
        <form.SubscribeButton
          submitLabel={flow === 'create' ? 'Create' : 'Update'}
          disableIfNotChanged={flow === 'update'}
        />
      </form.AppForm>
    </form>
  );
}
