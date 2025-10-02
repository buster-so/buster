import { useParams } from '@tanstack/react-router';

export const useGetReasoningMessageId = () => {
  const params = useParams({ strict: false });
  return params?.messageId;
};
