export const canUserAccessChat = async ({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}) => {
  console.warn("TODO: Implement doesUserHaveAccessToChat");
  return !!userId && !!chatId;
};
