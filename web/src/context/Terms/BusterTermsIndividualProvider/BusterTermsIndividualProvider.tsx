import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useBusterTermsCreate } from './useBusterTermsCreate';
import { useBusterTermsUpdate } from './useBusterTermsUpdate';

const useBusterTermsIndividual = () => {
  const createTerms = useBusterTermsCreate();
  const updateTerms = useBusterTermsUpdate();

  return {
    ...createTerms,
    ...updateTerms
  };
};

const BusterTermsIndividualContext = createContext<ReturnType<typeof useBusterTermsIndividual>>(
  {} as ReturnType<typeof useBusterTermsIndividual>
);

export const BusterTermsIndividualProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <BusterTermsIndividualContext.Provider value={useBusterTermsIndividual()}>
      {children}
    </BusterTermsIndividualContext.Provider>
  );
};

export const useBusterTermsIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterTermsIndividual>) => T
) => useContextSelector(BusterTermsIndividualContext, selector);
