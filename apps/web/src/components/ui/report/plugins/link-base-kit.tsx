import { BaseLinkPlugin } from '@platejs/link';

import { LinkElementStatic } from '../elements/LinkNodeStatic';

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)];
