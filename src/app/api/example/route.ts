import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareService } from '@/core/middleware/middleware';

export async function GET(request: NextRequest) {
    // Check if user is authenticated
    if (!MiddlewareService.isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user context
    const userContext = MiddlewareService.getUserContext(request);

    return NextResponse.json({
        message: 'Hello from protected API!',
        user: userContext
    });
}
