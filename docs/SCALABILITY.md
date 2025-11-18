# Scalability Features

This document describes the scalability features implemented in the Figma Flow Mapper application.

## Overview

The application includes three main scalability features:

1. **Database Connection Pooling**
2. **API Rate Limiting**
3. **Caching Strategy**

## 1. Database Connection Pooling

### Configuration

Located in `lib/db/index.ts`, the database connection pool is configured with optimal settings for production use:

```typescript
{
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // Maximum 20 connections in pool
  idleTimeoutMillis: 30000,      // Close idle connections after 30s
  connectionTimeoutMillis: 2000  // Timeout after 2s if connection fails
}
```

### Usage

The pool is automatically managed and reused across requests:

```typescript
import { db, query, getClient } from '@/lib/db'

// Using Drizzle ORM (recommended)
const users = await db.query.users.findMany()

// Using raw SQL queries
const result = await query('SELECT * FROM users WHERE id = $1', [userId])

// Getting a client for transactions
const client = await getClient()
try {
  await client.query('BEGIN')
  // ... transaction operations
  await client.query('COMMIT')
} finally {
  client.release()
}
```

### Benefits

- **Performance**: Reuses connections instead of creating new ones
- **Scalability**: Handles concurrent requests efficiently
- **Reliability**: Automatic cleanup of idle connections
- **Resource Management**: Prevents connection exhaustion

## 2. API Rate Limiting

### Configuration

Rate limiting is implemented in `middleware.ts` using Upstash Redis:

- **Limit**: 100 requests per hour per IP address
- **Algorithm**: Sliding window (prevents burst attacks)
- **Scope**: All `/api/*` routes

### Setup

1. Sign up for a free account at [Upstash](https://upstash.com/)
2. Create a Redis database
3. Add credentials to `.env`:

```bash
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```

### Behavior

#### When Rate Limit is Reached

**Response:**
```json
{
  "error": "Too many requests",
  "limit": 100,
  "reset": 1699999999,
  "remaining": 0
}
```

**Status Code:** `429 Too Many Requests`

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999
```

#### Normal Operation

All successful API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1699999999
```

### Optional Setup

If Upstash credentials are not provided, rate limiting is automatically disabled. This allows development without Redis:

```typescript
// Rate limiting only activates if credentials exist
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Initialize rate limiter
}
```

## 3. Caching Strategy

### Figma API Caching

Figma file data is cached to reduce API calls and improve performance.

#### Implementation

Located in `app/api/figma/file/route.ts`:

```typescript
const getCachedFile = unstable_cache(
  async (fileKey: string, token: string) => {
    const client = new FigmaClient(token)
    return await client.getFile(fileKey)
  },
  ['figma-file'],
  { revalidate: 3600 } // Cache for 1 hour
)
```

#### Cache Durations

Defined in `lib/cache.ts`:

| Resource | Duration | Reason |
|----------|----------|--------|
| Figma File | 1 hour (3600s) | Files change infrequently |
| Figma Images | 2 hours (7200s) | Images are static once rendered |
| Figma Nodes | 30 minutes (1800s) | Node data may update more often |
| Project Data | 5 minutes (300s) | User-specific data changes frequently |

#### Cache Invalidation

Manually invalidate caches when needed:

```typescript
import { invalidateFigmaFileCache } from '@/lib/cache'

// Force refresh Figma data
invalidateFigmaFileCache()
```

#### Usage Example

```typescript
// GET /api/figma/file?fileKey=abc123xyz
// First request: Fetches from Figma API
// Subsequent requests (within 1 hour): Returns cached data
```

### Benefits

- **Reduced API Costs**: Fewer calls to Figma API
- **Faster Response Times**: Cached data served instantly
- **Better UX**: Users see results faster
- **Reliability**: Less dependent on external API availability

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Page Load | < 2s | Edge caching, code splitting |
| Frame Parsing | 50 frames in < 10s | Efficient algorithms, batching |
| Export Generation | 100 frames in < 5s | Streaming responses |
| Canvas Rendering | 60fps with 100+ nodes | React Flow virtualization |
| Search | < 200ms | Database indexing |

## Database Optimization

### Indexes

All foreign keys and frequently queried fields are indexed:

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_frames_project_id ON frames(project_id);
CREATE INDEX idx_connections_from_frame_id ON connections(from_frame_id);
-- ... and more
```

### Row-Level Security (RLS)

PostgreSQL RLS ensures users only access their own data:

```sql
CREATE POLICY projects_policy ON projects
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID);
```

## Monitoring

### Recommended Metrics to Track

1. **Database**
   - Connection pool utilization
   - Query execution time
   - Slow query count

2. **API**
   - Request rate per endpoint
   - Response times (p50, p95, p99)
   - Error rates

3. **Cache**
   - Hit/miss ratio
   - Cache size
   - Eviction rate

4. **Rate Limiting**
   - Requests blocked
   - Top IPs hitting limits

### Tools

- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Web vitals and performance
- **PostHog**: Product analytics and feature usage
- **Upstash Console**: Redis metrics and rate limit analytics

## Deployment Considerations

### Environment Variables

Ensure all required variables are set:

```bash
# Required
DATABASE_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
ENCRYPTION_KEY

# Optional (but recommended for production)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### Production Checklist

- [ ] Database connection pool configured
- [ ] Upstash Redis set up for rate limiting
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Indexes created
- [ ] Row-level security enabled
- [ ] Monitoring tools configured

### Scaling Strategy

#### Horizontal Scaling

The application is stateless and can scale horizontally:

- Multiple Next.js instances can run concurrently
- Shared PostgreSQL database (consider read replicas)
- Shared Redis for rate limiting
- CDN for static assets

#### Vertical Scaling

Database can be scaled vertically:

- Increase connection pool size for more connections
- Upgrade database instance for better performance
- Add read replicas for read-heavy workloads

#### Caching Layers

Additional caching can be added:

- **CDN**: CloudFlare, Vercel Edge Network
- **Application Cache**: Redis for session data
- **Database Cache**: PostgreSQL query cache
- **Client Cache**: Browser caching, Service Workers

## Troubleshooting

### Connection Pool Exhausted

**Error:** "Cannot acquire connection - pool exhausted"

**Solutions:**
1. Increase `max` connections in pool config
2. Check for connection leaks (always release clients)
3. Optimize slow queries
4. Add database read replicas

### Rate Limit Issues

**Error:** Users hitting rate limits too quickly

**Solutions:**
1. Increase rate limit in `middleware.ts`
2. Implement tiered limits based on user plan
3. Add IP whitelisting for trusted sources
4. Use user-based limits instead of IP-based

### Cache Invalidation

**Issue:** Users seeing stale data

**Solutions:**
1. Reduce cache duration
2. Implement manual cache invalidation on updates
3. Use cache tags for granular invalidation
4. Add cache versioning

## Best Practices

1. **Always Release Connections**
   ```typescript
   const client = await getClient()
   try {
     // Use client
   } finally {
     client.release() // Always release!
   }
   ```

2. **Monitor Rate Limits**
   - Log when users hit limits
   - Alert on unusual patterns
   - Adjust limits based on usage

3. **Cache Strategically**
   - Cache expensive operations
   - Don't cache user-specific data too long
   - Use appropriate cache keys

4. **Test Under Load**
   - Load test with realistic traffic
   - Monitor connection pool under load
   - Verify rate limiting works correctly

## Future Improvements

- [ ] Implement Redis for session storage
- [ ] Add database read replicas
- [ ] Implement GraphQL subscriptions for real-time updates
- [ ] Add background job queue (Bull/BullMQ)
- [ ] Implement CDN for Figma thumbnail caching
- [ ] Add database query optimization and EXPLAIN analysis
- [ ] Implement automatic scaling based on load
- [ ] Add distributed tracing (OpenTelemetry)
