import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { CalibreWebClient } from '@/lib/calibre-web';
import { encrypt, decrypt } from '@/lib/credential-encryption';

const DEFAULT_USER_ID = 'default';

// GET - Retrieve current Calibre-Web settings (without password)
export const GET = withAuth(async () => {
  try {
    const settings = await db.calibreWebSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
      select: {
        id: true,
        serverUrl: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      settings: {
        ...settings,
        hasPassword: true,
      },
    });
  } catch (error) {
    console.error('Error fetching Calibre-Web settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Calibre-Web settings' },
      { status: 500 }
    );
  }
});

// POST - Create or update Calibre-Web settings
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, username, password } = body;

    if (!serverUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Server URL, username, and password are required' },
        { status: 400 }
      );
    }

    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid server URL format' },
        { status: 400 }
      );
    }

    // Test connection before saving
    const client = new CalibreWebClient(serverUrl, username, password);
    const result = await client.testConnection();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to connect to Calibre-Web server.' },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password);
    const settings = await db.calibreWebSettings.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: { serverUrl, username, password: encryptedPassword },
      create: { userId: DEFAULT_USER_ID, serverUrl, username, password: encryptedPassword },
      select: {
        id: true,
        serverUrl: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Calibre-Web settings saved successfully',
      settings: { ...settings, hasPassword: true },
    });
  } catch (error) {
    console.error('Error saving Calibre-Web settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Calibre-Web settings' },
      { status: 500 }
    );
  }
});

// PATCH - Update specific fields
export const PATCH = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, username, password } = body;

    const existing = await db.calibreWebSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No existing settings found. Use POST to create.' },
        { status: 404 }
      );
    }

    const updateData: { serverUrl?: string; username?: string; password?: string } = {};
    if (serverUrl) updateData.serverUrl = serverUrl;
    if (username) updateData.username = username;
    if (password) updateData.password = encrypt(password);

    const testServerUrl = serverUrl || existing.serverUrl;
    const testUsername = username || existing.username;
    const testPassword = password || decrypt(existing.password);

    const client = new CalibreWebClient(testServerUrl, testUsername, testPassword);
    const result = await client.testConnection();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to connect with updated settings' },
        { status: 400 }
      );
    }

    const settings = await db.calibreWebSettings.update({
      where: { userId: DEFAULT_USER_ID },
      data: updateData,
      select: {
        id: true,
        serverUrl: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Calibre-Web settings updated successfully',
      settings: { ...settings, hasPassword: true },
    });
  } catch (error) {
    console.error('Error updating Calibre-Web settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Calibre-Web settings' },
      { status: 500 }
    );
  }
});

// DELETE - Remove Calibre-Web settings
export const DELETE = withAuth(async () => {
  try {
    await db.calibreWebSettings.delete({
      where: { userId: DEFAULT_USER_ID },
    });

    return NextResponse.json({
      success: true,
      message: 'Calibre-Web settings removed',
    });
  } catch (error) {
    console.error('Error deleting Calibre-Web settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete Calibre-Web settings' },
      { status: 500 }
    );
  }
});
