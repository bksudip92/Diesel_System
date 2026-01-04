# Supabase Setup Guide

This guide will help you connect your Expo app to your self-hosted Supabase server.

## Configuration

### Option 1: Direct Configuration (Quick Setup)

Edit the file `config/supabase.ts` and update the following values:

```typescript
export const SUPABASE_URL = 'http://localhost:8000'; // Your Supabase URL
export const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Your anon/public key
```

### Option 2: Environment Variables (Recommended for Production)

1. Create a `.env` file in the root of your project:
```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Install expo-constants if not already installed:
```bash
npm install expo-constants
```

Note: Environment variables with `EXPO_PUBLIC_` prefix are available in your app.

## Finding Your Supabase Credentials

1. **Supabase URL**: 
   - For local development, this is typically `http://localhost:8000`
   - Or check your Supabase configuration/docker-compose.yml for the configured port
   - You can also check your Supabase dashboard URL

2. **Anon Key**:
   - Go to your Supabase dashboard (usually at `http://localhost:8000` or your configured port)
   - Navigate to Settings > API
   - Copy the "anon" or "public" key (NOT the service_role key)

## Testing the Connection

1. Start your Supabase server (if not already running)
2. Update the configuration in `config/supabase.ts` with your credentials
3. Run your Expo app:
   ```bash
   npm start
   ```
4. Try signing up with a new account or signing in with an existing account

## Features Included

- ✅ Email/Password Authentication (Sign Up & Sign In)
- ✅ Session persistence (users stay logged in)
- ✅ Secure token storage using AsyncStorage
- ✅ Input validation
- ✅ Error handling with user-friendly messages

## Troubleshooting

### Connection Issues

- **"Failed to fetch" errors**: 
  - Check that your Supabase server is running
  - Verify the URL is correct (check for typos, correct port)
  - For Android emulator, use `10.0.2.2` instead of `localhost`
  - For iOS simulator, `localhost` should work
  - For physical devices, use your computer's IP address (e.g., `http://192.168.1.100:8000`)

### Authentication Issues

- **"Invalid login credentials"**: 
  - Check that email confirmation is disabled in Supabase Auth settings, OR
  - Verify your email after signup if email confirmation is enabled

- **"Email already registered"**: 
  - The email is already in use, try signing in instead

## Next Steps

After successful authentication, you can:
- Access user data via `supabase.auth.getUser()`
- Store additional user data in Supabase tables
- Implement protected routes
- Add more authentication methods (OAuth, etc.)

