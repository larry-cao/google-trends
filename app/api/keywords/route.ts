import { NextResponse } from 'next/server';
import { saveKeyword, getKeywords } from '@/app/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  
  const keywords = await getKeywords();
  const filteredKeywords = search
    ? keywords.filter(k => k.keyword.toLowerCase().includes(search.toLowerCase()))
    : keywords;
    
  return NextResponse.json(filteredKeywords);
}

export async function POST(request: Request) {
  const { keyword } = await request.json();
  const result = await saveKeyword(keyword);
  return NextResponse.json(result);
} 
