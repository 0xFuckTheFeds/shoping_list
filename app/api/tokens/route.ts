// app/api/tokens/route.ts
import { NextResponse } from 'next/server';
import { fetchAllTokensFromDune } from '@/app/actions/dune-actions';

export async function GET() {
  try {
    const tokens = await fetchAllTokensFromDune();
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch tokens' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}