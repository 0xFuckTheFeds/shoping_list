import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const adminCredentials = {
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '12345678',
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email !== adminCredentials.email) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (password !== adminCredentials.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const adminToken = process.env.ADMIN_TOKEN || uuidv4();

    const cookieStore = await cookies();
    cookieStore.set('admin-token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, 
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}