// frontend/src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, body);

    if (!response.data) {
      throw new Error('Signup failed');
    }

    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Signup failed' },
      { status: 400 }
    );
  }
}
