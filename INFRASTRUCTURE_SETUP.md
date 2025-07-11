# 🚀 Infrastructure Setup Guide

This guide covers setting up production-ready infrastructure for the Bun Video Chat application with Cloudflare R2 file storage and PostgreSQL database.

## 📊 Database Options

### Option 1: PostgreSQL (Recommended for Production)

#### Local PostgreSQL Setup

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb bun_video_chat

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/bun_video_chat"
```

#### Hosted PostgreSQL Options

**🏆 Neon (Recommended)**

- Serverless PostgreSQL with generous free tier
- Excellent for development and production
- Setup: https://neon.tech

```bash
# Example Neon connection string
DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb"
```

**🚀 Supabase**

- PostgreSQL with real-time features
- Great for chat applications
- Setup: https://supabase.com

```bash
# Example Supabase connection string
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

**🛤️ Railway**

- Simple deployment platform
- Good for full-stack apps
- Setup: https://railway.app

### Option 2: Turso (LibSQL) - SQLite Compatible

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create bun-video-chat

# Get connection details
turso db show bun-video-chat

# Set environment variables
DATABASE_URL="libsql://your-database-url"
DATABASE_AUTH_TOKEN="your-auth-token"
```

### Option 3: PlanetScale (MySQL)

```bash
# Example PlanetScale connection string
DATABASE_URL="mysql://username:password@host:port/database?sslaccept=strict"
```

## 🗄️ File Storage: Cloudflare R2

### Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `bun-video-chat-files`)

### Step 2: Create API Token

1. Go to "Manage R2 API tokens"
2. Create token with R2 permissions
3. Note down the credentials

### Step 3: Configure Environment Variables

```bash
# Required R2 Configuration
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=bun-video-chat-files

# Optional: For public bucket access
R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

### Step 4: Set up Custom Domain (Optional)

1. In R2 bucket settings, add custom domain
2. Configure DNS in Cloudflare
3. Enable public access if needed

## 🔧 Environment Configuration

Create `.env` file in project root:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (choose one)
# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/bun_video_chat

# Turso (LibSQL)
# DATABASE_URL=libsql://your-database-url
# DATABASE_AUTH_TOKEN=your-auth-token

# PlanetScale (MySQL)
# DATABASE_URL=mysql://username:password@host:port/database

# Authentication
AUTH_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=bun-video-chat-files
R2_PUBLIC_URL=https://your-bucket.your-domain.com

# WebRTC STUN/TURN servers
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=
TURN_USERNAME=
TURN_PASSWORD=
```

## 🚀 Deployment Commands

### Database Setup

```bash
# For PostgreSQL
bun run db:migrate:postgres

# For SQLite (development)
bun run db:migrate

# Seed with sample data
bun run db:seed
```

### Development

```bash
# Install dependencies
bun install

# Build CSS
bun run build:css

# Start development server
bun run dev
```

### Production Build

```bash
# Build application
bun run build

# Start production server
bun start
```

## 🔒 Security Considerations

### Database Security

- Use connection pooling for PostgreSQL
- Enable SSL/TLS for database connections
- Use environment variables for credentials
- Regular backups and monitoring

### File Storage Security

- Configure proper CORS policies
- Use signed URLs for private files
- Implement file type and size validation
- Regular cleanup of unused files

### Application Security

- Strong JWT secrets (use `openssl rand -base64 32`)
- Rate limiting for API endpoints
- Input validation and sanitization
- HTTPS in production

## 📈 Performance Optimization

### Database

- Add indexes for frequently queried columns
- Use connection pooling
- Implement query optimization
- Consider read replicas for high traffic

### File Storage

- Use CDN for file delivery
- Implement proper caching headers
- Compress images before upload
- Use appropriate file formats

### Application

- Enable gzip compression
- Use HTTP/2
- Implement proper caching strategies
- Monitor performance metrics

## 🔍 Monitoring & Logging

### Database Monitoring

- Query performance tracking
- Connection pool monitoring
- Error rate monitoring

### File Storage Monitoring

- Upload/download success rates
- Storage usage tracking
- CDN performance metrics

### Application Monitoring

- WebSocket connection health
- API response times
- Error tracking and alerting

## 🚨 Troubleshooting

### Common Database Issues

```bash
# Test database connection
bun run db:test

# Check migration status
bun run db:migrate --dry-run

# Reset database (development only)
bun run db:reset
```

### Common R2 Issues

```bash
# Test R2 connection
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets" \
  -H "Authorization: Bearer {api_token}"

# Check bucket permissions
# Verify CORS settings
# Test file upload/download
```

### Performance Issues

- Check database query performance
- Monitor file upload/download speeds
- Verify CDN configuration
- Check WebSocket connection stability

## 📚 Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
