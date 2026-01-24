import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { GmailEmail, GmailResponse } from '@/types/gmail';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GmailMessageHeader {
  name: string;
  value: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    headers: GmailMessageHeader[];
  };
  internalDate: string;
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  resultSizeEstimate: number;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
} | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth configuration for token refresh');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh token:', errorText);
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Parse email header to extract sender name and email
 */
function parseFromHeader(from: string): { name: string; email: string } {
  // Format: "Name <email@example.com>" or just "email@example.com"
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: (match[1] || match[2]).trim(),
      email: match[2].trim(),
    };
  }
  return { name: from, email: from };
}

/**
 * GET /api/gmail
 * Fetches recent emails from Gmail
 */
export const GET = withAuth(async () => {
  try {
    // Get stored tokens from database (we only have one user)
    const gmailToken = await db.gmailToken.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!gmailToken) {
      return NextResponse.json(
        { error: 'Gmail not connected', connected: false },
        { status: 404 }
      );
    }

    let accessToken = gmailToken.accessToken;

    // Check if token is expired (with 5 minute buffer)
    const isExpired = new Date(gmailToken.expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);

    if (isExpired) {
      console.log('Gmail access token expired, refreshing...');

      if (!gmailToken.refreshToken) {
        // No refresh token, need to re-authenticate
        return NextResponse.json(
          { error: 'Gmail token expired, please reconnect', connected: false },
          { status: 401 }
        );
      }

      const newTokens = await refreshAccessToken(gmailToken.refreshToken);

      if (!newTokens) {
        return NextResponse.json(
          { error: 'Failed to refresh Gmail token, please reconnect', connected: false },
          { status: 401 }
        );
      }

      // Update tokens in database
      await db.gmailToken.update({
        where: { id: gmailToken.id },
        data: {
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      accessToken = newTokens.accessToken;
      console.log('Gmail token refreshed successfully');
    }

    // Fetch list of messages (last 10 from inbox)
    const listResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        return NextResponse.json(
          { error: 'Gmail authentication failed, please reconnect', connected: false },
          { status: 401 }
        );
      }
      console.error('Failed to fetch Gmail messages:', await listResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch emails' },
        { status: 500 }
      );
    }

    const listData: GmailListResponse = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
      const response: GmailResponse = {
        emails: [],
        unreadCount: 0,
        connected: true,
      };
      return NextResponse.json(response);
    }

    // Fetch details for each message in parallel
    const messagePromises = listData.messages.map(async (msg) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!msgResponse.ok) {
        console.error(`Failed to fetch message ${msg.id}`);
        return null;
      }

      return msgResponse.json() as Promise<GmailMessage>;
    });

    const messages = (await Promise.all(messagePromises)).filter(
      (msg): msg is GmailMessage => msg !== null
    );

    // Transform messages to our format
    const emails: GmailEmail[] = messages.map((msg) => {
      const headers = msg.payload?.headers || [];
      const fromHeader = headers.find((h) => h.name.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
      const dateHeader = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

      const { name, email } = parseFromHeader(fromHeader);
      const isUnread = msg.labelIds?.includes('UNREAD') || false;

      return {
        id: msg.id,
        threadId: msg.threadId,
        from: name,
        fromEmail: email,
        subject: subjectHeader,
        snippet: msg.snippet,
        date: dateHeader || new Date(parseInt(msg.internalDate)).toISOString(),
        isUnread,
      };
    });

    // Count unread emails
    const unreadCount = emails.filter((e) => e.isUnread).length;

    const response: GmailResponse = {
      emails,
      unreadCount,
      connected: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
});
