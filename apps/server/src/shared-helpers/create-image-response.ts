export const createImageResponse = (
  imageBuffer: Buffer,
  type: 'png' | 'jpeg' = 'png'
): Response => {
  return new Response(imageBuffer, {
    headers: {
      'Content-Type': `image/${type}`,
      'Content-Length': imageBuffer.length.toString(),
    },
  });
};
