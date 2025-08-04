import { BaseCalloutPlugin } from '@platejs/callout';

import { CalloutElementStatic } from '../elements/CalloutNodeStatic';

export const BaseCalloutKit = [BaseCalloutPlugin.withComponent(CalloutElementStatic)];
