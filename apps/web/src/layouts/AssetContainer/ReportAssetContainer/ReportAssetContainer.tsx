import { ClientOnly } from '@tanstack/react-router';
import React from 'react';
import { ReportVersionModal } from '@/components/features/versionHistory/ReportVersionModal';
import { AssetContainer } from '../AssetContainer';
import { ReportContainerHeaderButtons } from './ReportContainerHeaderButtons';
import { ReportContainerHeaderSegment } from './ReportContainerHeaderSegment';
import { ReportAssetContextProvider } from './ReportContextProvider';

export const ReportAssetContainer: React.FC<{
  children: React.ReactNode;
  reportId: string;
  reportVersionNumber: number | undefined;
}> = ({ children, reportId, reportVersionNumber }) => {
  return (
    <ClientOnly>
      <ReportAssetContextProvider>
        {({ closeVersionHistoryMode, versionHistoryMode }) => {
          return (
            <React.Fragment>
              <AssetContainer
                scrollable={false}
                header={
                  <ReportAssetHeader
                    reportId={reportId}
                    reportVersionNumber={reportVersionNumber}
                  />
                }
              >
                {children}
              </AssetContainer>

              <ReportVersionModal
                onClose={closeVersionHistoryMode}
                versionNumber={versionHistoryMode}
                reportId={reportId}
              />
            </React.Fragment>
          );
        }}
      </ReportAssetContextProvider>
    </ClientOnly>
  );
};

const ReportAssetHeader: React.FC<{
  reportId: string;
  reportVersionNumber: number | undefined;
}> = ({ reportId, reportVersionNumber }) => {
  return (
    <>
      <ReportContainerHeaderSegment reportId={reportId} reportVersionNumber={reportVersionNumber} />

      <ReportContainerHeaderButtons reportId={reportId} reportVersionNumber={reportVersionNumber} />
    </>
  );
};
