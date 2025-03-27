'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex space-x-1 overflow-hidden rounded bg-purple-500 p-5">
      <div className="flex flex-col">
        {Array.from({ length: 20 }).map((_, index) => (
          <Link
            key={index}
            href={`/private/${index}`}
            onMouseEnter={() => {
              console.log('prefetching', index);
              router.prefetch(`/private/${index}`);
            }}
            className="h-5 w-full min-w-20 cursor-pointer bg-green-500 hover:bg-green-600">
            Parent Layout{index}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
