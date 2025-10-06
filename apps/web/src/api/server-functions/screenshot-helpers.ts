export const createScreenshotResponse = ({
  screenshotBuffer,
}: {
  screenshotBuffer: Buffer<ArrayBufferLike>;
}) => {
  if (!screenshotBuffer) {
    throw new Error('Screenshot buffer is required');
  }

  return new Response(new Uint8Array(screenshotBuffer), {
    headers: { 'Content-Type': 'image/png', 'Content-Length': screenshotBuffer.length.toString() },
  });
};
