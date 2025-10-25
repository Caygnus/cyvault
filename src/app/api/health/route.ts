import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Health check successful',
        pathname: request.nextUrl.pathname,
        headers: Object.fromEntries(request.headers.entries())
    });
}
