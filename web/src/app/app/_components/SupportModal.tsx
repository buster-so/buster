import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { Input } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { submitAppSupportRequest } from '@/api/buster-rest/nextjs/support';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { AppModal } from '@/components';

export const SupportModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const user = useUserConfigContextSelector((state) => state.user);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const [selectedForm, setSelectedForm] = useState<'feedback' | 'help'>('feedback');
  const [loading, setLoading] = useState(false);
  const { openSuccessMessage, openErrorNotification } = useBusterNotifications();
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [helpRequest, setHelpRequest] = useState('');

  const handleSubmitHelpRequest = useMemoizedFn(async () => {
    setLoading(true);
    try {
      const res = await submitAppSupportRequest({
        userName: user?.name!,
        userEmail: user?.email!,
        userId: user?.id!,
        subject,
        message: selectedForm === 'feedback' ? feedback : helpRequest,
        type: selectedForm === 'feedback' ? 'feedback' : 'help',
        organizationId: userOrganizations?.id!
      });
      setLoading(false);
      openSuccessMessage('Help request submitted successfully');
      onClose();
    } catch (error) {
      openErrorNotification('Failed to submit help request');
      setLoading(false);
    }
  });

  const disabled = useMemo(() => {
    if (selectedForm === 'feedback') {
      return !feedback;
    }
    return !subject || !helpRequest;
  }, [feedback, subject, helpRequest, selectedForm]);

  const memoizedFooter = useMemo(() => {
    return {
      left:
        selectedForm === 'feedback' ? (
          <div className="flex items-center space-x-1">
            <Text size="md" type="secondary">
              Looking for help?
            </Text>
            <Text
              size="md"
              type="link"
              onClick={() => {
                setSelectedForm('help');
              }}>
              Contact support
            </Text>
          </div>
        ) : undefined,
      primaryButton: {
        text: 'Submit request',
        onClick: handleSubmitHelpRequest,
        loading,
        disabled
      }
    };
  }, [selectedForm, loading, disabled]);

  const memoizedHeader = useMemo(() => {
    if (selectedForm === 'feedback') {
      return {
        title: 'Leave feedback',
        description: `We'd love to hear what went well or how we can improve the product experience. With your feedback, we'll be able to see the page that you're currently on.`
      };
    }

    return {
      title: 'Contact support',
      description: `Contact support to report issues or ask questions. With your request, we’ll be able to see the page that you’re currently on.`
    };
  }, [selectedForm]);

  useLayoutEffect(() => {
    if (open) {
      setSubject('');
      setHelpRequest('');
      setFeedback('');
      setSelectedForm('feedback');
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      {selectedForm === 'feedback' && (
        <FeedbackForm
          feedback={feedback}
          setFeedback={setFeedback}
          handleSubmitFeedback={handleSubmitHelpRequest}
        />
      )}
      {selectedForm === 'help' && (
        <HelpRequestForm
          subject={subject}
          setSubject={setSubject}
          helpRequest={helpRequest}
          setHelpRequest={setHelpRequest}
          handleSubmitHelpRequest={handleSubmitHelpRequest}
        />
      )}
    </AppModal>
  );
});

SupportModal.displayName = 'SupportModal';

const FeedbackForm = React.memo(
  ({
    feedback,
    setFeedback,
    handleSubmitFeedback
  }: {
    feedback: string;
    setFeedback: (feedback: string) => void;
    handleSubmitFeedback: () => void;
  }) => {
    return (
      <div className="flex flex-col space-y-4">
        <Input.TextArea
          rows={5}
          value={feedback}
          autoFocus
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did you like or dislike about the product?"
          onPressEnter={handleSubmitFeedback}
        />
      </div>
    );
  }
);

FeedbackForm.displayName = 'FeedbackForm';

const HelpRequestForm = React.memo(
  ({
    subject,
    setSubject,
    helpRequest,
    setHelpRequest,
    handleSubmitHelpRequest
  }: {
    subject: string;
    setSubject: (subject: string) => void;
    helpRequest: string;
    setHelpRequest: (helpRequest: string) => void;
    handleSubmitHelpRequest: () => void;
  }) => {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" type="secondary">
            Subject
          </Text>
          <Input
            className="w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sumary of the request"
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" type="secondary">
            Message
          </Text>
          <Input.TextArea
            rows={5}
            value={helpRequest}
            onChange={(e) => setHelpRequest(e.target.value)}
            placeholder="A thorough and precise description of the the problem you are having..."
            onPressEnter={handleSubmitHelpRequest}
          />
        </div>
      </div>
    );
  }
);
HelpRequestForm.displayName = 'HelpRequestForm';
