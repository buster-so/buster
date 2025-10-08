import { hasMetricScreenshotBeenTakenWithin } from '@buster/database/queries';
import type {
  GetMetricScreenshotParams,
  GetMetricScreenshotQuery,
} from '@buster/server-shared/screenshots';
import dayjs from 'dayjs';
import type { Context } from 'hono';
import type { BrowserParams } from '../../../../../shared-helpers/browser-login';
import { getMetricScreenshotHandler } from './getMetricScreenshotHandler';

const shouldTakenNewScreenshot = async ({
  metricId,
  isOnSaveEvent,
}: { metricId: string; isOnSaveEvent: boolean }) => {
  const isScreenshotExpired = await hasMetricScreenshotBeenTakenWithin(
    metricId,
    dayjs().subtract(6, 'hours')
  );

  return !isScreenshotExpired;
};

export const saveMetricScreenshotHandler = async ({
  params,
  search,
  ...rest
}: {
  params: GetMetricScreenshotParams;
  search: GetMetricScreenshotQuery;
} & BrowserParams<Buffer<ArrayBufferLike>>) => {
  const shouldTakeNewScreenshot = await shouldTakenNewScreenshot({
    metricId: params.id,
    isOnSaveEvent: true,
  });
  if (!shouldTakeNewScreenshot) {
    return;
  }

  const browserParams = rest as BrowserParams<Buffer<ArrayBufferLike>>;

  const screenshotBuffer = await getMetricScreenshotHandler({
    params,
    search,
    ...browserParams,
  });
  console.log('screenshotBuffer', screenshotBuffer);

  //TODO: save the screenshot to the database
};
