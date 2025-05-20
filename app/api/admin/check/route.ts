import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin-token')?.value;
  
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }
  
  return NextResponse.json({ isAdmin: true });
}