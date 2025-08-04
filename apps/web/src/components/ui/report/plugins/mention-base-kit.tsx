import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '../elements/MentionNodeStatic';

export const BaseMentionKit = [BaseMentionPlugin.withComponent(MentionElementStatic)];
