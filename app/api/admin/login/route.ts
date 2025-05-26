import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

const adminCredentials = {
  email: process.env.ADMIN_EMAIL || '',
  password: process.env.PASSWORD || '',
};

const JWT_SECRET = process.env.JWT_SECRET || '';

if(!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

function isRateLimited(ip: string): boolean{
  const attempts = loginAttempts.get(ip);
  if(!attempts) return false;

  const now=Date.now();
  if(now - attempts.lastAttempt > LOCKOUT_TIME){
    return false;
  }

  return attempts.count >= MAX_ATTEMPTS;
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if(!attempts|| now - attempts.lastAttempt > LOCKOUT_TIME){
    loginAttempts.set(ip, {count: 1, lastAttempt: now});
  }else {
    loginAttempts.set(ip, {
      count: attempts.count + 1,
      lastAttempt: now
    });
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {

  const clientIP = getClientIP(request);

  try {
  if(isRateLimited(clientIP)){
    return NextResponse.json(
      {error: 'Too many login attempts. Please try again later'},
      {status: 429}
    );
  }
    
    const { email, password } = await request.json();

    if(!email || !password) {
      recordLoginAttempt(clientIP);
      return NextResponse.json({ error: 'Email and password are required'})
    }

    if (email !== adminCredentials.email) {
      recordLoginAttempt(clientIP);
      return NextResponse.json({ error: 'Invalid email credentials' }, { status: 401 });
    }

    if(password!== adminCredentials.password){
      recordLoginAttempt(clientIP);
      return NextResponse.json({error: 'InValid password credentials'}, {status: 401});
    }

    clearLoginAttempts(clientIP);

    const payload = {
      email: adminCredentials.email,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    };

    const token = jwt.sign(payload, JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, 
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Login successful' });
  } catch (error) {
    recordLoginAttempt(clientIP);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function verifyAdminToken(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;
    
    if (!token) return false;
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.email === adminCredentials.email && decoded.role === 'admin';
  } catch (error) {
    return false;
  }
}