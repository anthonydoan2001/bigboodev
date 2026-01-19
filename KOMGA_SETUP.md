# Komga Integration Setup Guide

This guide will help you set up the Komga comic library integration for your bigboo.dev dashboard.

## Prerequisites

- Self-hosted Komga server running and accessible
- Komga API v1 access
- Basic Auth credentials (username + password)

## Environment Variables

Add the following environment variables to your `.env.local` file (for local development) and Vercel environment variables (for production):

```bash
KOMGA_API_URL=https://komga.bigboo.dev/api/v1
KOMGA_BASE_URL=https://komga.bigboo.dev
KOMGA_USERNAME=your-readonly-username
KOMGA_PASSWORD=your-secure-password
NEXT_PUBLIC_KOMGA_BASE_URL=https://komga.bigboo.dev
```

**Important Notes:**
- `KOMGA_API_URL`, `KOMGA_USERNAME`, and `KOMGA_PASSWORD` are server-side only (no `NEXT_PUBLIC_` prefix)
- `NEXT_PUBLIC_KOMGA_BASE_URL` is used client-side to generate reader URLs
- Use a **read-only** Komga user account for security

## Creating a Read-Only API User in Komga

1. Log into your Komga admin panel
2. Navigate to **Settings** → **Users**
3. Click **Add User** or edit an existing user
4. Create a user with:
   - Username: `dashboard-readonly-user` (or your preferred name)
   - Password: Set a secure password
   - **Roles**: Only assign read-only permissions (no admin, no write access)
5. Save the user credentials

**Security Best Practices:**
- Use a dedicated read-only account (not your admin account)
- Use a strong, unique password
- Regularly rotate the password
- Limit the account to only necessary libraries if possible

## CORS Configuration

To allow your dashboard to make API calls to Komga, you need to configure CORS in Komga:

1. Log into your Komga admin panel
2. Navigate to **Settings** → **Security**
3. Find the **CORS Origins** section
4. Add your dashboard domain: `https://bigboo.dev`
5. If testing locally, also add: `http://localhost:3000` (or your local dev port)
6. Save the settings

**CORS Origins Format:**
- Production: `https://bigboo.dev`
- Local Development: `http://localhost:3000`

## API Endpoints Reference

The integration uses the following Komga API endpoints:

### Books
- `GET /api/v1/books` - List all books
- `GET /api/v1/books?sort=createdDate,desc&size=10` - Recently added books
- `GET /api/v1/books?read_status=IN_PROGRESS` - In-progress books
- `GET /api/v1/books?search={query}` - Search books
- `GET /api/v1/books/{bookId}` - Get book details
- `GET /api/v1/books/{bookId}/thumbnail` - Get book thumbnail

### Series
- `GET /api/v1/series` - List all series

### Libraries
- `GET /api/v1/libraries` - List all libraries

### Reader
- `GET https://komga.bigboo.dev/book/{bookId}` - Open book in Komga reader

## Troubleshooting

### Authentication Errors

**Error: "Komga authentication failed"**
- Verify `KOMGA_USERNAME` and `KOMGA_PASSWORD` are correct
- Check that the user account exists and is active
- Ensure credentials don't have extra spaces or special characters

**Error: "Komga credentials not configured"**
- Verify all environment variables are set
- Restart your development server after adding env vars
- For Vercel, ensure env vars are set in project settings

### CORS Errors

**Error: "CORS policy blocked"**
- Add `https://bigboo.dev` to Komga's CORS Origins
- For local dev, add `http://localhost:3000`
- Restart Komga server after changing CORS settings
- Check browser console for specific CORS error details

### Connection Errors

**Error: "Failed to fetch from Komga API"**
- Verify Komga server is running and accessible
- Check `KOMGA_API_URL` is correct (should end with `/api/v1`)
- Test the API URL directly in browser: `https://komga.bigboo.dev/api/v1/books` (will prompt for auth)
- Check network connectivity and firewall rules

### Thumbnail Issues

**Thumbnails not loading:**
- Komga may need to generate thumbnails (check Komga admin panel)
- Verify thumbnail proxy route is working: `/api/komga/thumbnail/{bookId}`
- Check browser console for 404 errors
- Some books may not have thumbnails (fallback placeholder will show)

### Empty Results

**No books showing:**
- Verify books exist in your Komga library
- Check that the API user has access to the libraries
- Ensure books are properly scanned in Komga
- Check browser console for API errors

### Search Not Working

**Search returns no results:**
- Verify search query is not empty
- Check Komga search is working in admin panel
- Some books may not have searchable metadata
- Try searching by exact title

## Testing the Integration

1. **Test API Connection:**
   - Visit `/manga` page
   - Check that library statistics load
   - Verify no error messages appear

2. **Test Recently Added:**
   - Ensure you have recently added books in Komga
   - Check that they appear in the "Recently Added" section

3. **Test Continue Reading:**
   - Start reading a book in Komga
   - Check that it appears in "Continue Reading" section
   - Verify progress bar shows correctly

4. **Test Search:**
   - Enter a search query
   - Verify results appear
   - Click a result to open in Komga reader

5. **Test Reader Links:**
   - Click any comic card
   - Verify it opens Komga reader in new tab
   - Check that reader loads correctly

## Phase 2: Custom Reader (Future)

The current implementation links to Komga's built-in reader. For Phase 2, a custom reader component is planned with:

- Custom page navigation
- Reading progress tracking
- Multiple reading modes (single page, double page, webtoon)
- Zoom controls
- Keyboard shortcuts
- Bookmarking

The placeholder component is located at `src/components/komga/ComicReader.tsx`.

## Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs (Vercel function logs)
3. Verify all environment variables are set correctly
4. Test Komga API directly with curl:
   ```bash
   curl -u username:password https://komga.bigboo.dev/api/v1/books
   ```

## Security Notes

- Never commit `.env.local` or `.env` files to git
- Use read-only API credentials
- Regularly rotate passwords
- Monitor API usage for unusual activity
- Consider rate limiting if needed
