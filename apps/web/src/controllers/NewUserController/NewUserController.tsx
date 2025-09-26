import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useCreateUserOrganization } from '@/api/buster_rest/users';
import {
  useGetUserBasicInfo,
  useGetUserOrganization,
} from '@/api/buster_rest/users/useGetUserInfo';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Paragraph, Title } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useConfetti } from '@/hooks/useConfetti';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { inputHasText } from '@/lib/text';

export const NewUserController = () => {
  const navigate = useNavigate();
  const user = useGetUserBasicInfo();
  const userOrganizations = useGetUserOrganization();
  const { mutateAsync: onCreateUserOrganization, isPending: submitting } =
    useCreateUserOrganization();

  const [started, setStarted] = useState(false);
  const [name, setName] = useState<string | undefined>(user?.name);
  const [company, setCompany] = useState<string | undefined>(userOrganizations?.name);
  const { fireConfetti } = useConfetti();

  const { openInfoMessage } = useBusterNotifications();

  const canSubmit = useMemo(() => inputHasText(name) && inputHasText(company), [name, company]);

  const handleSubmit = useMemoizedFn(async () => {
    if (!canSubmit || !name || !company) {
      openInfoMessage('Please fill in all fields');
      return;
    }

    try {
      await onCreateUserOrganization({
        name,
        company,
      });
      fireConfetti();
      await navigate({
        to: '/app/home',
        replace: true,
      });
    } catch (error) {
      //
    }
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!started && (
        <motion.div
          initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            y: 10,
            filter: 'blur(4px)',
            transition: {
              duration: 0.2,
              opacity: { duration: 0.175 },
              filter: { duration: 0.18 },
            },
          }}
          key={'no-started'}
          className="flex h-full w-full flex-col items-start justify-center space-y-5 p-12"
        >
          <Title as={'h3'}>Welcome to Buster</Title>
          <Paragraph variant="secondary">
            With Buster, you can ask data questions in plain english & instantly get back data.
          </Paragraph>
          <Button variant="black" onClick={() => setStarted(true)}>
            Get Started
          </Button>
        </motion.div>
      )}

      {started && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          key={'started'}
          className="flex h-full w-full flex-col items-start justify-center space-y-5 p-12"
        >
          <Title as={'h4'}>Tell us about yourself</Title>
          <Input
            placeholder="What is your full name"
            className="w-full"
            value={name || ''}
            name="name"
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSubmit}
          />
          <Input
            placeholder="What is the name of your company"
            className="w-full"
            name="company"
            disabled={!!userOrganizations?.name}
            value={company || ''}
            onChange={(e) => setCompany(e.target.value)}
            onPressEnter={handleSubmit}
          />
          <Button
            variant="black"
            loading={submitting}
            onClick={async () => {
              handleSubmit();
            }}
          >
            Create your account
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
