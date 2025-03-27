'use client';

export default function Error(params: any) {
  const errorMessage = params.error.message;

  return <div>Error {errorMessage}</div>;
}
