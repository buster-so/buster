import { create } from 'mutative';
import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import type {
  ChatEvent_GeneratingTitle,
  ChatEvent_GeneratingResponseMessage,
  ChatEvent_GeneratingReasoningMessage
} from '@/api/buster_socket/chats';
import type {
  BusterChatResponseMessage_text,
  BusterChatMessageReasoning_text,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_file
} from '@/api/asset_interfaces/chat';

const createInitialMessage = (messageId: string): IBusterChatMessage => ({
  id: messageId,
  isCompletedStream: false,
  request_message: {
    request: '',
    sender_id: '',
    sender_name: '',
    sender_avatar: null
  },
  response_message_ids: [],
  reasoning_message_ids: [],
  response_messages: {},
  reasoning_messages: {},
  created_at: new Date().toISOString(),
  final_reasoning_message: null,
  feedback: null
});

export const initializeOrUpdateMessage = (
  messageId: string,
  currentMessage: IBusterChatMessage | undefined,
  updateFn: (draft: IBusterChatMessage) => void
) => {
  return create(currentMessage || createInitialMessage(messageId), (draft) => {
    updateFn(draft);
  });
};

export const updateChatTitle = (
  currentChat: IBusterChat,
  event: ChatEvent_GeneratingTitle
): IBusterChat => {
  const { chat_id, title, title_chunk, progress } = event;
  const isCompleted = progress === 'completed';
  const currentTitle = currentChat.title || '';
  const newTitle = isCompleted ? title : currentTitle + title_chunk;
  return create(currentChat, (draft) => {
    if (newTitle) draft.title = newTitle;
  });
};

export const updateResponseMessage = (
  messageId: string,
  currentMessage: IBusterChatMessage | undefined,
  event: ChatEvent_GeneratingResponseMessage
): IBusterChatMessage => {
  const { response_message } = event;

  if (!response_message?.id) {
    return currentMessage || createInitialMessage(messageId);
  }

  const responseMessageId = response_message.id;
  const existingResponseMessage = currentMessage?.response_messages?.[responseMessageId];
  const isNewResponseMessage = !existingResponseMessage;

  let updatedMessage = currentMessage || createInitialMessage(messageId);

  if (isNewResponseMessage) {
    updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
      if (!draft.response_messages) {
        draft.response_messages = {};
      }
      draft.response_messages[responseMessageId] = response_message;
      if (!draft.response_message_ids) {
        draft.response_message_ids = [];
      }
      draft.response_message_ids.push(responseMessageId);
    });
  }

  if (response_message.type === 'text') {
    const existingResponseMessageText = existingResponseMessage as BusterChatResponseMessage_text;
    const isStreaming =
      response_message.message_chunk !== undefined && response_message.message_chunk !== null;

    updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
      const responseMessage = draft.response_messages?.[responseMessageId];
      if (!responseMessage) return;
      const messageText = responseMessage as BusterChatResponseMessage_text;
      Object.assign(messageText, {
        ...existingResponseMessageText,
        ...response_message,
        message: isStreaming
          ? (existingResponseMessageText?.message || '') + (response_message.message_chunk || '')
          : response_message.message
      });
    });
  }

  return updatedMessage;
};

export const updateReasoningMessage = (
  messageId: string,
  currentMessage: IBusterChatMessage | undefined,
  reasoning: ChatEvent_GeneratingReasoningMessage['reasoning']
): IBusterChatMessage => {
  const reasoningMessageId = reasoning.id;
  const existingReasoningMessage = currentMessage?.reasoning_messages?.[reasoningMessageId];
  const isNewReasoningMessage = !existingReasoningMessage;
  let updatedMessage = currentMessage || createInitialMessage(messageId);

  if (isNewReasoningMessage) {
    updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
      if (!draft.reasoning_messages) {
        draft.reasoning_messages = {};
      }
      draft.reasoning_messages[reasoningMessageId] = reasoning;
      if (!draft.reasoning_message_ids) {
        draft.reasoning_message_ids = [];
      }
      draft.reasoning_message_ids.push(reasoningMessageId);
    });
  }

  switch (reasoning.type) {
    case 'text': {
      const existingReasoningMessageText =
        existingReasoningMessage as BusterChatMessageReasoning_text;
      const isStreaming = reasoning.message_chunk !== null || reasoning.message_chunk !== undefined;

      updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
        const reasoningMessage = draft.reasoning_messages?.[reasoningMessageId];
        if (!reasoningMessage) return;
        const messageText = reasoningMessage as BusterChatMessageReasoning_text;

        Object.assign(messageText, {
          ...existingReasoningMessageText,
          ...reasoning,
          message: isStreaming
            ? (existingReasoningMessageText?.message || '') + (reasoning.message_chunk || '')
            : reasoning.message
        });
      });
      break;
    }
    case 'files': {
      const existingReasoningMessageFiles =
        existingReasoningMessage as BusterChatMessageReasoning_files;

      updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
        const reasoningMessage = draft.reasoning_messages?.[reasoningMessageId];
        if (!reasoningMessage) return;

        const messageFiles = create(
          reasoningMessage as BusterChatMessageReasoning_files,
          (draft) => {
            draft.file_ids = existingReasoningMessageFiles?.file_ids || [];

            if (reasoning.status) draft.status = reasoning.status;
            if (reasoning.title) draft.title = reasoning.title;
            if (reasoning.secondary_title) draft.secondary_title = reasoning.secondary_title;

            for (const fileId of reasoning.file_ids) {
              if (!draft.file_ids.includes(fileId)) {
                draft.file_ids.push(fileId);
              }

              if (!draft.files) {
                draft.files = {};
              }

              if (!draft.files[fileId]) {
                draft.files[fileId] = {} as BusterChatMessageReasoning_file;
              }

              const existingFile = existingReasoningMessageFiles?.files[fileId];
              const newFile: BusterChatMessageReasoning_file | undefined = reasoning.files[fileId];

              draft.files[fileId] = create(draft.files[fileId], (fileDraft) => {
                // Merge existing and new file data
                Object.assign(fileDraft, existingFile || {}, newFile);

                // Handle file text specifically
                if (newFile?.file) {
                  fileDraft.file = create(fileDraft.file, (fileContentDraft) => {
                    Object.assign(fileContentDraft, existingFile?.file || {});
                    fileContentDraft.text = newFile.file.text_chunk
                      ? (existingFile?.file?.text || '') + newFile.file.text_chunk
                      : (existingFile?.file?.text ?? newFile.file.text); //we are going to ignore newfile text in favor of existing... this is because Dallin is having a tough time keep yaml in order
                    fileContentDraft.modified =
                      newFile.file.modified ?? existingFile?.file?.modified;
                  });
                }
              });
            }
          }
        );

        draft.reasoning_messages[reasoningMessageId] = messageFiles;
      });
      break;
    }
    case 'pills': {
      updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
        if (!draft.reasoning_messages?.[reasoningMessageId]) return;
        draft.reasoning_messages[reasoningMessageId] = reasoning;
      });
      break;
    }
    default: {
      const type: never = reasoning;
      break;
    }
  }

  return updatedMessage;
};
