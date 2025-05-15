# Believe Screener Redis Cache

This project demonstrates how to use Upstash Redis with Next.js for efficient caching of API data in the Believe Screener application.

## Features

- **Redis Caching**: Efficiently cache API responses to minimize Dune API usage
- **Cache Administration**: Monitor and manage cache status through a dedicated admin interface
- **Automatic Cache Invalidation**: Cache entries automatically expire after 2.5 hours
- **Environment-aware**: Only makes real API calls in production when explicitly enabled
- **Fallback Mechanism**: Falls back to cached data or mock data when API calls fail

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   \`\`\`
   # Upstash Redis REST API URL and token (provided by Vercel KV integration)
   KV_REST_API_URL=https://your-instance.upstash.io
   KV_REST_API_TOKEN=your_upstash_redis_token
   
   # Enable Dune API calls (set to true only in production)
   ENABLE_DUNE_API=false
   \`\`\`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Cache Administration

The cache admin interface is available at `/admin/cache`. This interface allows you to:

- View cache status and health
- Manually refresh all data
- Clear specific cache entries or all cache
- View all cache keys

## Environment Variables

- `KV_REST_API_URL`: Your Upstash Redis REST API URL (starts with https://)
- `KV_REST_API_TOKEN`: Your Upstash Redis API token
- `ENABLE_DUNE_API`: Set to `true` to enable real Dune API calls (default: `false`)
- `VERCEL_ENV`: Automatically set by Vercel to indicate the environment

## Cache Keys

The following cache keys are used:

- `believe:token-data`: Cached token data
- `believe:market-stats`: Cached market statistics
- `believe:last-fetch-time`: Timestamp of the last data fetch
- `believe:volume-data`: Cached volume data
- `believe:last-volume-fetch-time`: Timestamp of the last volume data fetch

## Cache Duration

All cache entries expire after 2.5 hours (9,000 seconds) to ensure data freshness while minimizing API calls.

## Troubleshooting

### Redis Connection Issues

If you encounter Redis connection issues, make sure:

1. You're using the REST API URL (starts with `https://`) and not the Redis connection string (starts with `rediss://`)
2. You're using the correct API token
3. Your Upstash Redis instance is active and accessible

The Vercel KV integration provides several environment variables:
- `KV_URL` or `REDIS_URL`: Redis connection string (starts with `rediss://`) - DO NOT use with @upstash/redis client
- `KV_REST_API_URL`: REST API URL (starts with `https://`) - USE THIS with @upstash/redis client
- `KV_REST_API_TOKEN`: REST API token for authentication
- `KV_REST_API_READ_ONLY_TOKEN`: Read-only token (optional)
\`\`\`

Let's also create a fallback mechanism in case Redis is not available:
