import { hasMetricScreenshotBeenTakenWithin } from '@buster/database/queries';
import type { BrowserParamsContextOrDirectRequest } from '@shared-helpers/browser-login';
import { DEFAULT_SCREENSHOT_CONFIG } from '@shared-helpers/screenshot-config';
import { uploadScreenshotHandler } from '@shared-helpers/upload-screenshot-handler';
import dayjs from 'dayjs';
import { getMetricScreenshotHandler } from './getMetricScreenshotHandler';

const shouldTakenNewScreenshot = async ({
  metricId,
  isOnSaveEvent,
}: { metricId: string; isOnSaveEvent: boolean }) => {
  if (isOnSaveEvent) {
    return true;
  }

  const isScreenshotExpired = await hasMetricScreenshotBeenTakenWithin(
    metricId,
    dayjs().subtract(6, 'hours')
  );

  return !isScreenshotExpired;
};

type SaveMetricScreenshotHandlerArgs = {
  metricId: string;
  version_number: number | undefined;
  isOnSaveEvent: boolean;
} & BrowserParamsContextOrDirectRequest;

export const saveMetricScreenshotHandler = async (args: SaveMetricScreenshotHandlerArgs) => {
  try {
    const { isOnSaveEvent, metricId } = args;

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      metricId,
      isOnSaveEvent,
    });
    if (!shouldTakeNewScreenshot) {
      return;
    }

    const screenshotBuffer = await getMetricScreenshotHandler({
      ...args,
      width: DEFAULT_SCREENSHOT_CONFIG.width,
      height: DEFAULT_SCREENSHOT_CONFIG.height,
    });
    const organizationId =
      'context' in args
        ? args.context.get('userOrganizationInfo').organizationId
        : args.organizationId;

    const result = await uploadScreenshotHandler({
      assetType: 'metric_file',
      assetId: metricId,
      image: screenshotBuffer,
      organizationId,
    });

    return result;
  } catch (error) {
    console.error('Error in saveMetricScreenshotHandler:', error);
    return {
      success: false,
    };
  }
};
