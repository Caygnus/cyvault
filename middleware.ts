import { NextRequest } from 'next/server';
import { MiddlewareService } from '@/core/middleware/middleware';

export default async function middleware(request: NextRequest) {
    return await MiddlewareService.handleRequest(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
