import React from 'react';
import { EditorContent } from './EditorContent';

const defaultLayout: [string, string] = ['auto', '170px'];

export default async function Page() {
  return <EditorContent defaultLayout={defaultLayout} />;
}
