import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';

/**
 * DELETE /api/gmail/disconnect
 * Removes stored Gmail tokens
 */
export const DELETE = withAuth(async () => {
  try {
    // Delete all Gmail tokens (single user app)
    const result = await db.gmailToken.deleteMany({});

    if (result.count === 0) {
      return NextResponse.json(
        { message: 'No Gmail connection found' },
        { status: 404 }
      );
    }

    console.log(`Disconnected Gmail (deleted ${result.count} token(s))`);

    return NextResponse.json({
      success: true,
      message: 'Gmail disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
});
