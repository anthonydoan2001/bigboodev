import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role key for privileged operations
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const BUCKET_NAME = 'note-attachments';

// Allowed file types and max size
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
export const ALLOWED_TEXT_TYPES = ['text/plain', 'text/csv', 'text/markdown'];
export const ALLOWED_SPREADSHEET_TYPES = [
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.oasis.opendocument.spreadsheet', // .ods
];
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_TEXT_TYPES,
  ...ALLOWED_SPREADSHEET_TYPES,
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file type and size
 */
export function validateFile(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: images, PDFs, text files (.txt, .csv, .md), and spreadsheets (.xls, .xlsx)`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 10MB`,
    };
  }

  return { valid: true };
}

/**
 * Get file type category
 */
export function getFileTypeCategory(mimeType: string): 'image' | 'pdf' | 'text' | 'spreadsheet' | 'unknown' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'pdf';
  if (ALLOWED_TEXT_TYPES.includes(mimeType)) return 'text';
  if (ALLOWED_SPREADSHEET_TYPES.includes(mimeType)) return 'spreadsheet';
  return 'unknown';
}

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(noteId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${noteId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  noteId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseAdmin();
  const filePath = generateFilePath(noteId, fileName);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Extract the path from the full URL if necessary
  let path = filePath;
  if (filePath.includes(BUCKET_NAME)) {
    const parts = filePath.split(`${BUCKET_NAME}/`);
    path = parts[parts.length - 1];
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete all files for a note
 */
export async function deleteNoteFiles(noteId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // List all files in the note's folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(noteId);

  if (listError) {
    console.error('Error listing files:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map((file) => `${noteId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting files:', deleteError);
    }
  }
}

/**
 * Ensure the storage bucket exists and has correct settings
 */
export async function ensureBucketExists(): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_FILE_TYPES,
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  } else {
    // Update existing bucket to allow new file types
    const { error } = await supabase.storage.updateBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_FILE_TYPES,
    });

    if (error) {
      console.error('Error updating bucket:', error);
    }
  }
}
