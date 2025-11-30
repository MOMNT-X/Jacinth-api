# Troubleshooting Guide

## Database Connection Issues

### Connection Pool Timeout Error

**Error**: `Timed out fetching a new connection from the connection pool`

**Cause**: The connection pool is exhausted or the connection string format is incorrect.

**Solution for Supabase**:

1. **Update your `.env` file with the correct connection strings**:

```env
# Use connection pooler URL with pgbouncer for regular queries
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# Use direct connection URL for migrations and schema operations
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
```

**Important points**:
- `DATABASE_URL` should have `?pgbouncer=true&connection_limit=1` for connection pooling
- `DIRECT_URL` should NOT have pgbouncer parameters
- Use `connection_limit=1` to avoid pool exhaustion
- Replace `YOUR_PASSWORD` with your actual database password

2. **Get your connection strings from Supabase**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the "Connection pooling" connection string for `DATABASE_URL`
   - Copy the "Connection string" (non-pooling) for `DIRECT_URL`

3. **Verify the connection**:
   ```bash
   # Test the connection
   psql "postgresql://postgres:YOUR_PASSWORD@aws-1-eu-north-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
   ```

### Cannot Reach Database Server Error

**Error**: `Can't reach database server at...`

**Solutions**:

1. **Check if the database URL is correct**
2. **Verify network connectivity**
3. **Check firewall settings** - Supabase allows connections from anywhere by default
4. **Verify credentials** - Double-check username and password
5. **Try the direct connection URL** if pooler doesn't work

## SendGrid Email Issues

### Permission Denied Error

**Error**: `Permission denied, wrong credentials`

**Solutions**:

1. **Verify your API key**:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Create a new API key with "Full Access" or "Mail Send" permissions
   - Copy the key immediately (it's only shown once)

2. **Verify your sender email**:
   - Go to https://app.sendgrid.com/settings/sender_auth/senders
   - Verify the email address you're using as the sender
   - The email must be verified before you can send from it

3. **Update your `.env` file**:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=your-verified-email@yourdomain.com
```

## Environment Variables Setup

Make sure your `.env` file in `jacinth-backend/` contains all required variables:

```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:PASSWORD@HOST.pooler.supabase.com:5432/postgres

# Application
PORT=3001
NODE_ENV=development
APP_NAME=Jacinth Pharmacy
APP_EMAIL=noreply@jacinthpharmacy.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=your-verified-email@yourdomain.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Providers
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
```

## Common Issues

### App starts but database operations fail

- Check that your `.env` file is in the `jacinth-backend/` directory
- Restart the application after updating `.env`
- Verify environment variables are being loaded (check logs)

### Connection works in one environment but not another

- Different environments may need different connection strings
- Local development might need direct connection
- Production should use connection pooling

## Getting Help

If issues persist:
1. Check the application logs for specific error messages
2. Verify all environment variables are set correctly
3. Test database connectivity using `psql` or similar tools
4. Check Supabase dashboard for connection status

