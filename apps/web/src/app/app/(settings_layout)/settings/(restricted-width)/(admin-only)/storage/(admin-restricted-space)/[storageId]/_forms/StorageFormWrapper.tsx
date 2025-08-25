'use client';

import type React from 'react';
import { Button } from '@/components/ui/buttons/Button';

// Define a more specific but limited interface for our form
export interface StorageFormApi {
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
  Subscribe: React.ComponentType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need access to form state values
    selector: (state: any) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to pass computed values to children
    children: (value: any) => React.ReactNode;
  }>;
}

export interface StorageFormWrapperProps {
  children: React.ReactNode;
  form: StorageFormApi;
}

export function StorageFormWrapper({ form, children }: StorageFormWrapperProps) {
  return (
    <form
      className="[&_.label-wrapper]:border-b-border flex flex-col space-y-4 [&_.label-wrapper]:border-b [&_.label-wrapper]:pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}>
      {children}

      <form.AppForm>
        <form.Subscribe
          selector={(state) => {
            const values = state.values;
            const allFieldsFilled = Object.values(values).every(
              (value) => value !== '' && value !== null && value !== undefined
            );
            return {
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
              allFieldsFilled
            };
          }}>
          {({ canSubmit, isSubmitting, allFieldsFilled }) => (
            <div className="flex w-full justify-end">
              <Button
                variant="black"
                type="submit"
                disabled={!canSubmit || !allFieldsFilled || isSubmitting}
                loading={isSubmitting}>
                Connect
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form.AppForm>
    </form>
  );
}
