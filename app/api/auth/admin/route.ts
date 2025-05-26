import { NextRequest, NextResponse } from 'next/server';

const ADMIN_CREDENTIALS = {
  email: 'admin@dashcoin.com',
  password: 'dashcoin123',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (
      email === ADMIN_CREDENTIALS.email && 
      password === ADMIN_CREDENTIALS.password
    ) {
      return NextResponse.json({ authenticated: true }, { status: 200 });
    } else {
      return NextResponse.json({ authenticated: false, error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return NextResponse.json({ authenticated: false, error: 'Authentication failed' }, { status: 500 });
  }
}