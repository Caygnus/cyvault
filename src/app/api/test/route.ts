import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log('🔍 API route hit:', request.nextUrl.pathname);
    console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()));

    return NextResponse.json({
        message: 'API route working',
        pathname: request.nextUrl.pathname,
        headers: Object.fromEntries(request.headers.entries())
    });
}
