import type React from 'react';
import type { MentionInputTriggerSeparator } from '../MentionInput.types';

export const MentionListSeperator: React.FC<MentionInputTriggerSeparator> = () => {
  return <hr className="border-border border-t my-1 -mx-1 w-[calc(100%+0.5rem)]" />;
};
