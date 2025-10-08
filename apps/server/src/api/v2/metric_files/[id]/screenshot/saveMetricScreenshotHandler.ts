import { hasMetricScreenshotBeenTakenWithin } from '@buster/database/queries';
import type {
  GetMetricScreenshotParams,
  GetMetricScreenshotQuery,
} from '@buster/server-shared/screenshots';
import type { BrowserParamsContextOrDirectRequest } from '@shared-helpers/browser-login';
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
  params: GetMetricScreenshotParams;
  search: GetMetricScreenshotQuery;
  isOnSaveEvent: boolean;
} & BrowserParamsContextOrDirectRequest;

export const saveMetricScreenshotHandler = async (args: SaveMetricScreenshotHandlerArgs) => {
  const { params, isOnSaveEvent } = args;

  const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
    metricId: params.id,
    isOnSaveEvent,
  });
  if (!shouldTakeNewScreenshot) {
    return;
  }

  const screenshotBuffer = await getMetricScreenshotHandler(args);
  const organizationId =
    'context' in args
      ? args.context.get('userOrganizationInfo').organizationId
      : args.organizationId;

  const result = await uploadScreenshotHandler({
    assetType: 'metric_file',
    assetId: params.id,
    image: screenshotBuffer,
    organizationId,
  });
  console.log('result', result);

  //TODO: save the screenshot to the database
};
