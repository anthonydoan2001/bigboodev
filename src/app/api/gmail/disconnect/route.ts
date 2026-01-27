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

    return NextResponse.json({
      success: true,
      message: 'Gmail disconnected successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
});
