import { headers } from 'next/headers';
import { getUserContext } from '@/core/middleware/helpers';

export default async function DashboardPage() {
    // Get user context from headers (set by middleware)
    const userContext = getUserContext({ headers: headers() } as any);

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
