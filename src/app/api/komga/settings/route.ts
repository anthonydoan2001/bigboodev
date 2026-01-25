import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/api-auth';
import { KomgaClient } from '@/lib/komga';

const DEFAULT_USER_ID = 'default';

// GET - Retrieve current Komga settings (without password)
export const GET = withAuth(async () => {
  try {
    const settings = await db.komgaSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
      select: {
        id: true,
        serverUrl: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        // Note: password is NOT selected for security
      },
    });

    if (!settings) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      configured: true,
      settings: {
        ...settings,
        hasPassword: true, // Indicate password is set without exposing it
      },
    });
  } catch (error) {
    console.error('Error fetching Komga settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Komga settings' },
      { status: 500 }
    );
  }
});

// POST - Create or update Komga settings
export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, email, password } = body;

    // Validate required fields
    if (!serverUrl || !email || !password) {
      return NextResponse.json(
        { error: 'Server URL, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid server URL format' },
        { status: 400 }
      );
    }

    // Test connection before saving
    const client = new KomgaClient(serverUrl, email, password);
    const isConnected = await client.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Komga server. Please check your credentials.' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await db.komgaSettings.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: {
        serverUrl,
        email,
        password, // In production, this should be encrypted
      },
      create: {
        userId: DEFAULT_USER_ID,
        serverUrl,
        email,
        password,
      },
      select: {
        id: true,
        serverUrl: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Komga settings saved successfully',
      settings: {
        ...settings,
        hasPassword: true,
      },
    });
  } catch (error) {
    console.error('Error saving Komga settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Komga settings' },
      { status: 500 }
    );
  }
});

// PATCH - Update specific fields
export const PATCH = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { serverUrl, email, password } = body;

    // Get existing settings
    const existing = await db.komgaSettings.findUnique({
      where: { userId: DEFAULT_USER_ID },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No existing settings found. Use POST to create.' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: { serverUrl?: string; email?: string; password?: string } = {};
    if (serverUrl) updateData.serverUrl = serverUrl;
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    // Test connection with new settings
    const testServerUrl = serverUrl || existing.serverUrl;
    const testEmail = email || existing.email;
    const testPassword = password || existing.password;

    const client = new KomgaClient(testServerUrl, testEmail, testPassword);
    const isConnected = await client.testConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect with updated settings' },
        { status: 400 }
      );
    }

    // Update settings
    const settings = await db.komgaSettings.update({
      where: { userId: DEFAULT_USER_ID },
      data: updateData,
      select: {
        id: true,
        serverUrl: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Komga settings updated successfully',
      settings: {
        ...settings,
        hasPassword: true,
      },
    });
  } catch (error) {
    console.error('Error updating Komga settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Komga settings' },
      { status: 500 }
    );
  }
});

// DELETE - Remove Komga settings
export const DELETE = withAuth(async () => {
  try {
    await db.komgaSettings.delete({
      where: { userId: DEFAULT_USER_ID },
    });

    return NextResponse.json({
      success: true,
      message: 'Komga settings removed',
    });
  } catch (error) {
    console.error('Error deleting Komga settings:', error);
    return NextResponse.json(
      { error: 'Failed to delete Komga settings' },
      { status: 500 }
    );
  }
});
