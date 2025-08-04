import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '../elements/CommentNodeStatic';

export const BaseCommentKit = [BaseCommentPlugin.withComponent(CommentLeafStatic)];
