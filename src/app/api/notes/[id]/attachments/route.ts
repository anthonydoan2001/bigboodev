import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { uploadFile, validateFile, getFileTypeCategory } from '@/lib/supabase-storage';

function getIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/notes\/([^/?]+)\/attachments/);
  return match ? match[1] : null;
}

export const POST = withAuth(async (request: Request, sessionToken: string) => {
  try {
    const noteId = getIdFromUrl(request.url);

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Verify note exists
    const note = await db.note.findUnique({ where: { id: noteId } });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile({ type: file.type, size: file.size });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { url: fileUrl } = await uploadFile(noteId, buffer, file.name, file.type);

    // Create attachment record
    const attachment = await db.noteAttachment.create({
      data: {
        noteId,
        fileName: file.name,
        fileUrl,
        fileType: getFileTypeCategory(file.type),
        fileSize: file.size,
      },
    });

    return NextResponse.json({ item: attachment });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
