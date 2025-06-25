import { NewUserController } from './_NewUserController';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to Buster 👋'
};

export default function NewUserPage() {
  return <NewUserController />;
}
