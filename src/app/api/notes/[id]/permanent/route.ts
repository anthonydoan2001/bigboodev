import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { deleteNoteFiles } from '@/lib/supabase-storage';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)\/permanent/);
  return match ? match[1] : null;
}

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const id = getIdFromUrl(request.url);

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete files from Supabase Storage
    try {
      await deleteNoteFiles(id);
    } catch (storageError) {
      console.error('Error deleting files from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Permanently delete the note (cascades to attachments, tags, taskNotes)
    await db.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    return NextResponse.json({ error: 'Failed to permanently delete note' }, { status: 500 });
  }
});
