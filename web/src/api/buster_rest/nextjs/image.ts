import nextApi from '@/api/next/instances';

export const uploadPreviewImage = async (threadId: string, file: File) => {
  const formData = new FormData();
  formData.append('threadId', threadId);
  formData.append('image', file);

  return await nextApi
    .post('/api/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((res) => res.data);
};
