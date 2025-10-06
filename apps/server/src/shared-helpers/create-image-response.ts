export const createImageResponse = (imageBuffer: Buffer, type: 'png' | 'jpeg'): Response => {
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': `image/${type}`,
      'Content-Length': imageBuffer.length.toString(),
    },
  });
};
