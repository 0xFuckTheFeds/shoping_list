import { NextResponse } from 'next/server';
import { fetchDexscreenerDataForDuneTokens } from '@/app/actions/dexscreener-actions';
import { fetchAllTokensFromDune } from '@/app/actions/dune-actions';

export async function GET() {
  try {
    // Get both Dune and Dexscreener data
    const [duneTokens, dexscreenerData] = await Promise.all([
      fetchAllTokensFromDune(),
      fetchDexscreenerDataForDuneTokens()
    ]);
    
    // Create an array that maintains the order from Dune tokens
    const orderedData = duneTokens
      .filter(token => token.token) // Filter out any tokens without addresses
      .map(token => ({
        address: token.token,
        symbol: token.symbol,
        name: token.name,
        marketCap: token.marketCap,
        dexscreenerData: dexscreenerData.get(token.token) || null
      }));

    return NextResponse.json(orderedData);
  } catch (error) {
    console.error('Error fetching Dexscreener data:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch Dexscreener data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 