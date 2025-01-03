import { NextResponse } from 'next/server';
import { deleteKeyword } from '@/app/lib/data';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const result = await deleteKeyword(params.id);
  return NextResponse.json(result);
} 
