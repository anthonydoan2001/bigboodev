import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { deleteFile } from '@/lib/supabase-storage';

function getIdsFromUrl(url: string): { noteId: string | null; attachmentId: string | null } {
  const match = url.match(/\/api\/notes\/([^/?]+)\/attachments\/([^/?]+)/);
  return {
    noteId: match ? match[1] : null,
    attachmentId: match ? match[2] : null,
  };
}

export const DELETE = withAuth(async (request: Request, _sessionToken: string) => {
  try {
    const { noteId, attachmentId } = getIdsFromUrl(request.url);

    if (!noteId || !attachmentId) {
      return NextResponse.json({ error: 'Note ID and Attachment ID are required' }, { status: 400 });
    }

    // Get attachment to find file URL
    const attachment = await db.noteAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    if (attachment.noteId !== noteId) {
      return NextResponse.json({ error: 'Attachment does not belong to this note' }, { status: 400 });
    }

    // Delete from Supabase Storage
    try {
      await deleteFile(attachment.fileUrl);
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await db.noteAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
});
