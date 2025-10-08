import {
  getUserOrganizationId,
  hasMetricScreenshotBeenTakenWithin,
} from '@buster/database/queries';
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

const activelyCapturingScreenshot = new Set<string>();

export const saveMetricScreenshotHandler = async (args: SaveMetricScreenshotHandlerArgs) => {
  try {
    const { isOnSaveEvent, metricId } = args;

    if (activelyCapturingScreenshot.has(metricId)) {
      return;
    }

    console.log('activelyCapturingScreenshot', activelyCapturingScreenshot);

    const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
      metricId,
      isOnSaveEvent,
    });

    if (!shouldTakeNewScreenshot) {
      return;
    }

    activelyCapturingScreenshot.add(metricId);
    const organizationId =
      'context' in args
        ? args.context.get('userOrganizationInfo')?.organizationId ||
          (await getUserOrganizationId(args.context.get('busterUser')?.id))?.organizationId
        : args.organizationId;

    if (!organizationId) {
      return {
        success: false,
      };
    }

    const screenshotBuffer = await getMetricScreenshotHandler({
      ...args,
      width: DEFAULT_SCREENSHOT_CONFIG.width,
      height: DEFAULT_SCREENSHOT_CONFIG.height,
    });

    console.log('screenshotBuffer', screenshotBuffer.length);

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
  } finally {
    activelyCapturingScreenshot.delete(args.metricId);
  }
};
