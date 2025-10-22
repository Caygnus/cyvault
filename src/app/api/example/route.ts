import { NextRequest, NextResponse } from 'next/server';
import { getUserContext, isAuthenticated } from '@/core/middleware/helpers';

export async function GET(request: NextRequest) {
    // Check if user is authenticated
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user context
    const userContext = getUserContext(request);

    return NextResponse.json({
        message: 'Hello from protected API!',
        user: userContext
    });
}
