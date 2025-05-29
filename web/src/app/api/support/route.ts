'use server';

import type { AppSupportRequest } from '@/api/buster_rest/nextjs/support';
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

const slackHookURL = process.env.NEXT_SLACK_APP_SUPPORT_URL || '';
const STORAGE_BUCKET = 'support-screenshots'; // Using the default public bucket that usually exists

export async function POST(request: NextRequest) {
  if (!slackHookURL) {
    console.error('Slack hook URL is not set');
    return NextResponse.json({ error: 'Slack hook URL is not set' }, { status: 500 });
  }

  const supabase = await createClient();

  // Parse and validate the request body
  const body = (await request.json()) as AppSupportRequest;

  if (
    !body.userName ||
    !body.userEmail ||
    !body.organizationId ||
    !body.userId ||
    !body.message ||
    !body.type
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Additional validation for help requests
  if (body.type === 'help' && !body.subject) {
    return NextResponse.json({ error: 'Help requests require a subject' }, { status: 400 });
  }

  // Handle screenshot upload if present
  let screenshotUrl: string | undefined;
  if (body.screenshot) {
    try {
      // Remove the data:image/png;base64, prefix if it exists
      const base64Data = body.screenshot.replace(/^data:image\/\w+;base64,/, '');

      // Convert base64 to Buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `${body.organizationId}/${timestamp}.png`;

      // Check if bucket exists
      const { data: buckets, error: errorBuckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET);
      const bucket = await supabase.storage.getBucket(STORAGE_BUCKET);

      if (!bucketExists) {
        console.error('Storage bucket does not exist:', STORAGE_BUCKET);
      } else {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filename, buffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
        } else {
          // Get the public URL
          const {
            data: { publicUrl }
          } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);

          screenshotUrl = publicUrl;
        }
      }
    } catch (error) {
      console.error('Error processing screenshot:', error);
    }
  }

  const slackMessage = {
    text: 'New Support Request',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New Support Request*'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Type:* ${body.type}`
          },
          ...(body.type === 'help'
            ? [
                {
                  type: 'mrkdwn',
                  text: `*Subject:* ${body.subject}`
                }
              ]
            : []),
          {
            type: 'mrkdwn',
            text: `*From:* ${body.userName}`
          },
          {
            type: 'mrkdwn',
            text: `*Email:* ${body.userEmail}`
          },
          {
            type: 'mrkdwn',
            text: `*User ID:* ${body.userId}`
          },
          {
            type: 'mrkdwn',
            text: `*Organization Name:* ${body.organizationName}`
          },
          {
            type: 'mrkdwn',
            text: `*Organization ID:* ${body.organizationId}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n${body.message}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Additional Information:*\n• URL: ${body.currentURL}\n• Timestamp: ${body.currentTimestamp}`
        }
      },
      ...(screenshotUrl
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Screenshot:*'
              }
            },
            {
              type: 'image',
              image_url: screenshotUrl,
              alt_text: 'Support request screenshot'
            }
          ]
        : body.screenshot
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Screenshot:* Failed to upload screenshot to storage. Screenshot was provided but could not be processed. Storage bucket does not exist: ${STORAGE_BUCKET}`
                }
              }
            ]
          : [])
    ]
  };

  // Send the formatted message to Slack
  try {
    // Remove screenshot block if URL is localhost/127.0.0.1
    if (
      screenshotUrl &&
      (screenshotUrl.includes('localhost') || screenshotUrl.includes('127.0.0.1'))
    ) {
      slackMessage.blocks = slackMessage.blocks.filter(
        (block) =>
          block.type !== 'image' &&
          !(block.type === 'section' && block.text?.text === '*Screenshot:*')
      );
    }

    const response = await fetch(slackHookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send message to Slack. Status:', response.status);
      console.error('Response:', errorText);

      return NextResponse.json(
        {
          error: 'Failed to send message to Slack',
          details: `Status ${response.status}: ${errorText}`
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message to Slack:', error);
    return NextResponse.json(
      {
        error: 'Failed to send message to Slack',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
