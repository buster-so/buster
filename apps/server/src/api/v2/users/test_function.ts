import { db } from '@buster/database';

export const testFunction = async () => {
  const users = db;
  return users;
};
