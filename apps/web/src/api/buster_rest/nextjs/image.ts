import nextApi from '@/api/next/instances';

export const uploadPreviewImage = async (metricId: string, file: File) => {
  const formData = new FormData();
  formData.append('metricId', metricId);
  formData.append('image', file);

  return await nextApi
    .post('/api/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((res) => res.data);
};
