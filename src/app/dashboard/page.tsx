import { headers } from 'next/headers';
import { getUserContext } from '@/core/middleware/helpers';

export default async function DashboardPage() {
    let userContext;

    try {
        // Get user context from headers (set by middleware)
        const headersList = await headers();
        userContext = getUserContext({ headers: headersList } as any);
    } catch (error) {
        console.error('Dashboard error:', error);
        userContext = { isAuthenticated: false };
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

            {userContext.isAuthenticated ? (
                <div>
                    <p>Welcome, {userContext.userEmail}!</p>
                    <p>User ID: {userContext.userId}</p>
                    {userContext.hasTenantContext && (
                        <p>Tenant ID: {userContext.tenantId}</p>
                    )}
                </div>
            ) : (
                <p>Not authenticated</p>
            )}
        </div>
    );
}
