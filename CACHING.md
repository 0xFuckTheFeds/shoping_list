# Dashcoin Dashboard Caching Strategy

This document explains the caching strategy implemented in the Dashcoin Dashboard to minimize Dune API usage while maintaining data freshness.

## Overview

The dashboard implements a dual-layer caching strategy:

1. **Persistent Caching**: Using Vercel KV (Redis) to store data across serverless function instances and deployments
2. **Environment Controls**: Using environment variables to completely disable API calls in non-production environments

## Cache Duration

- All Dune API data is cached for **2.5 hours** (9,000 seconds)
- This results in approximately 9.6 API calls per day (96 credits) or 2,880 credits per month
- Dexscreener API data is cached for 15 minutes to provide more frequent price updates without using Dune credits

## Environment Variables

The following environment variables control the caching behavior:

- `ENABLE_DUNE_API`: Set to `true` to enable real Dune API calls (default: `false`)
- `VERCEL_ENV`: Automatically set by Vercel to indicate the environment (`production`, `preview`, or `development`)

## Production Environment

In the production environment:

1. Set `ENABLE_DUNE_API=true` to enable real API calls
2. Configure Vercel KV for persistent caching
3. The dashboard will make API calls only when the cache is expired (every 2.5 hours)

## Development/Testing Environment

In development and testing environments:

1. Leave `ENABLE_DUNE_API` unset or set to `false`
2. The dashboard will use mock data instead of making real API calls
3. This ensures zero API credits are used during development and testing

## Mock Data System

The dashboard includes a comprehensive mock data system that:

1. Provides realistic data for all dashboard components
2. Mimics the structure of real Dune API responses
3. Includes randomization to simulate real-world data variations

## Fallback Mechanism

If API calls fail or the cache is unavailable, the dashboard will:

1. Try to use cached data first
2. Fall back to mock data if no cached data is available
3. Log appropriate error messages for debugging

## Monitoring and Debugging

The dashboard includes logging to help monitor cache status and API usage:

1. Console logs indicate when data is fetched from Dune vs. from cache
2. Error logs capture any issues with API calls or cache operations
3. The UI displays when data was last updated

## Implementation Details

The caching system is implemented across several files:

- `lib/cache.ts`: Core caching functionality using Vercel KV
- `lib/mock-data.ts`: Mock data for development and testing
- `app/actions/dune-actions.ts`: Integration with Dune API and caching logic

## Estimated API Usage

With this implementation, the expected Dune API usage is:

- **Daily**: 96 credits (9.6 API calls at 10 credits each)
- **Monthly**: 2,880 credits
- **Yearly**: 34,560 credits

This is well below the target of 3,500 credits per month.
\`\`\`

Let's update the .env.local file to set the environment variables:
