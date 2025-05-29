import { submitAppSupportRequest } from '@/api/buster_rest/nextjs/support';
import { Input } from '@/components/ui/inputs';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { AppModal } from '@/components/ui/modal';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';
import { capturePageScreenshot } from '@/lib/exportUtils';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';

export const SupportModal: React.FC<{
  onClose: () => void;
  formType?: 'feedback' | 'help' | false;
}> = React.memo(({ onClose, formType = 'feedback' }) => {
  const open = formType !== false;
  const user = useUserConfigContextSelector((state) => state.user);
  const userOrganizations = useUserConfigContextSelector((state) => state.userOrganizations);
  const [selectedForm, setSelectedForm] = useState<'feedback' | 'help'>(formType || 'feedback');
  const [loading, setLoading] = useState(false);
  const { openSuccessMessage, openErrorNotification } = useBusterNotifications();
  const [subject, setSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [helpRequest, setHelpRequest] = useState('');

  const handleSubmitHelpRequest = useMemoizedFn(async () => {
    setLoading(true);
    try {
      const mainBody = document.body as HTMLElement;
      await timeout(100);
      const screenshot = await capturePageScreenshot(mainBody, [
        '.dialog-content',
        '.dialog-overlay'
      ]);

      const res = await submitAppSupportRequest({
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        userId: user?.id || 'Unknown',
        subject,
        message: selectedForm === 'feedback' ? feedback : helpRequest,
        type: selectedForm === 'feedback' ? 'feedback' : 'help',
        organizationId: userOrganizations?.id || '',
        organizationName: userOrganizations?.name || '',
        currentURL: window.location.href,
        currentTimestamp: new Date().toISOString(),
        screenshot
      });
      setLoading(false);
      openSuccessMessage('Help request submitted successfully');
      onClose();
    } catch (error) {
      console.error(error);
      openErrorNotification({ title: 'Failed to submit help request' });
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
          <div className="flex items-center space-x-1.5">
            <Text variant="secondary">Looking for help?</Text>
            <Text
              variant="link"
              className="cursor-pointer"
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
      description: `Contact support to report issues or ask questions. With your request, we'll be able to see the page that you're currently on.`
    };
  }, [selectedForm]);

  useEffect(() => {
    if (formType) {
      setSelectedForm(formType);
    }
  }, [formType]);

  useLayoutEffect(() => {
    if (open) {
      setSubject('');
      setHelpRequest('');
      setFeedback('');
      setSelectedForm(formType);
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
        <InputTextArea
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
          <Text size="sm" variant="secondary">
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
          <Text size="sm" variant="secondary">
            Message
          </Text>
          <InputTextArea
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
