import { NextRequest } from 'next/server';
import { AuthMiddleware } from '@/core/middleware/middleware';

export default async function proxy(request: NextRequest) {
    return await AuthMiddleware(request);
}

// Configure which routes this middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};