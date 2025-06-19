import { ReasoningController } from '@/controllers/ReasoningController';

export default async function Page(props: {
  params: Promise<{ chatId: string; messageId: string }>;
}) {
  const params = await props.params;

  const { chatId, messageId } = params;

  return <ReasoningController chatId={chatId} messageId={messageId} />;
}
