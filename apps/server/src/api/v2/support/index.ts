import { SLACK_KEYS, getSecret } from '@buster/secrets';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth';

const app = new Hono();

const SUPPORT_REQUEST_SCHEMA = z.object({
  userName: z.string(),
  userEmail: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  message: z.string(),
  type: z.enum(['feedback', 'help']),
  subject: z.string().optional(),
  screenshot: z.string().optional(),
  organizationName: z.string().optional(),
  currentURL: z.string(),
});

app
  .use('*', requireAuth)
  /*
This is a POST endpoint that sends a support request to the Buster team.

*/
  .post('/', zValidator('json', SUPPORT_REQUEST_SCHEMA), async (c) => {
    const slackHookURL = await getSecret(SLACK_KEYS.SLACK_APP_SUPPORT_URL);
    const request = c.req.valid('json');
    const {
      type,
      subject,
      message,
      userName,
      userEmail,
      userId,
      organizationId,
      organizationName,
      currentURL,
    } = request;
    const currentTimestamp = new Date().toISOString();

    if (!slackHookURL) {
      console.error('Slack hook URL is not set');
      return c.json({ error: 'Slack hook URL is not set' }, { status: 500 });
    }

    if (type === 'help' && !subject) {
      return c.json({ error: 'Help requests require a subject' }, { status: 400 });
    }

    const slackMessage = {
      text: 'New Support Request',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*New Support Request*',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Type:* ${type}`,
            },
            ...(type === 'help'
              ? [
                  {
                    type: 'mrkdwn',
                    text: `*Subject:* ${subject}`,
                  },
                ]
              : []),
            {
              type: 'mrkdwn',
              text: `*From:* ${userName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:* ${userEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*User ID:* ${userId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Organization Name:* ${organizationName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Organization ID:* ${organizationId}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:*\n${message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Additional Information:*\n• URL: ${currentURL}\n• Timestamp: ${currentTimestamp}`,
          },
        },
        //   ...(screenshotUrl
        //     ? [
        //         {
        //           type: 'section',
        //           text: {
        //             type: 'mrkdwn',
        //             text: '*Screenshot:*',
        //           },
        //         },
        //         {
        //           type: 'image',
        //           image_url: screenshotUrl,
        //           alt_text: 'Support request screenshot',
        //         },
        //       ]
        //     : body.screenshot
        //       ? [
        //           {
        //             type: 'section',
        //             text: {
        //               type: 'mrkdwn',
        //               text: `*Screenshot:* Failed to upload screenshot to storage. Screenshot was provided but could not be processed. Storage bucket does not exist: ${STORAGE_BUCKET}`,
        //             },
        //           },
        //         ]
        //       : [])
        //       ,
      ],
    };

    const response = await fetch(slackHookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send message to Slack. Status:', response.status);
      console.error('Response:', errorText);

      return c.json(
        {
          error: 'Failed to send message to Buster team',
          details: `Status ${response.status}: ${errorText}`,
        },
        { status: 500 }
      );
    }

    return c.json({ success: true });
  });

export default app;
