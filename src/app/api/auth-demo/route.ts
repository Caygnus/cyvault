import { NextRequest, NextResponse } from 'next/server';
import { MiddlewareService } from '@/core/middleware/middleware';

export async function GET(request: NextRequest) {
    // Single import, all authentication methods available
    const isAuth = MiddlewareService.isAuthenticated(request);
    const userId = MiddlewareService.getCurrentUserId(request);
    const userEmail = MiddlewareService.getCurrentUserEmail(request);
    const tenantId = MiddlewareService.getCurrentTenantId(request);
    const hasTenant = MiddlewareService.hasTenantContext(request);
    const fullContext = MiddlewareService.getUserContext(request);

    return NextResponse.json({
        message: 'MiddlewareService Demo - All methods from single interface',
        authentication: {
            isAuthenticated: isAuth,
            userId,
            userEmail,
            tenantId,
            hasTenantContext: hasTenant,
            fullContext
        },
        timestamp: new Date().toISOString()
    });
}
