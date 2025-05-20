import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article'; 

export async function GET() {
  try {
    await dbConnect();
    const articles = await Article.find({}).sort({ createdAt: -1 });
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await dbConnect();
    
    const article = new Article(body);
    await article.save();
    
    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}