import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="px-[30px] pt-[46px]">{children}</div>;
}
