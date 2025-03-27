'use client';

import { cn } from '@/lib/classMerge';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const param = useParams() as { id: string };
  const id = Number(param.id);

  console.log('param', param);

  return (
    <div className="flex space-x-2 bg-red-500">
      <div className="flex flex-col">
        {Array.from({ length: 20 }).map((_, index) => (
          <Link
            key={index}
            href={`/private/${index}`}
            className={cn(
              'h-5 w-full min-w-20 cursor-pointer bg-green-500 hover:bg-green-600',
              id === index && 'bg-green-800 text-white hover:bg-green-800'
            )}>
            Child Layout {index}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
