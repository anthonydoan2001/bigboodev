import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';

export const POST = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const body = await request.json();
    const { folderIds, sectionId } = body as {
      folderIds: string[];
      sectionId: string | null;
    };

    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      return NextResponse.json({ error: 'folderIds array is required' }, { status: 400 });
    }

    // Update all folders in a transaction
    await db.$transaction(
      folderIds.map((id, index) =>
        db.bookmarkFolder.update({
          where: { id },
          data: { position: index, sectionId: sectionId },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering bookmark folders:', error);
    return NextResponse.json(
      {
        error: 'Failed to reorder bookmark folders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
