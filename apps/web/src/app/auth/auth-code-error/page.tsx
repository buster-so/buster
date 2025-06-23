import { StatusCard } from '@/components/ui/card/StatusCard';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex h-[100vh] w-full items-center justify-center p-4">
      <StatusCard title="Auth Code Error" variant={'danger'} message="Please contact support." />
    </div>
  );
}
