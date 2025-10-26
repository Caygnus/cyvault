# RequestContext System

## Overview

The RequestContext system provides a Go-like context mechanism for Next.js applications, enabling request-scoped data propagation throughout the application without explicit parameter passing.

## Key Features

- **Request-scoped data storage** using AsyncLocalStorage
- **Automatic context initialization** in middleware
- **Type-safe access** to context values
- **Error handling** with custom error types
- **Server action support** for client components
- **Unified middleware** approach

## Architecture

### Core Components

1. **RequestContext Class** (`src/core/context/context.ts`)

   - Main context management using AsyncLocalStorage
   - Type-safe getters and setters
   - Error handling for missing context/keys

2. **Middleware Integration** (`src/core/middleware/middleware.ts`)

   - Automatic context initialization
   - User authentication and header setting
   - Unified error handling

3. **Server Actions** (`src/core/actions/user-actions.ts`)
   - Client component integration
   - Context-aware data fetching

## Usage

### API Routes

```typescript
import { withApiHandler } from "@/core/middleware";
import { RequestContext } from "@/core/context/context";

async function handler(request: NextRequest) {
  const userId = RequestContext.getUserId();
  const tenantId = RequestContext.tryGetTenantId();
  // ... your logic
}

export const GET = withApiHandler(handler);
```

### Server Actions

```typescript
import { getCurrentUser } from "@/core/actions/user-actions";

export default function MyComponent() {
  const user = await getCurrentUser();
  return <div>{user?.email}</div>;
}
```

### Service Layer

```typescript
import { RequestContext } from "@/core/context/context";

export class UserService {
  async getCurrentUser() {
    const userId = RequestContext.getUserId();
    // ... your logic
  }
}
```

## Context Keys

The system uses the `UserHeaders` enum for consistent key management:

```typescript
export enum UserHeaders {
  USER_ID = "x-user-id",
  USER_EMAIL = "x-user-email",
  TENANT_ID = "x-tenant-id",
}
```

## Error Handling

### Custom Error Types

- **NoContextError**: Thrown when no context is available
- **ContextKeyError**: Thrown when a specific key is not found

### Safe Access Methods

- `tryGetUserId()`: Returns undefined if not found
- `tryGetUserEmail()`: Returns undefined if not found
- `tryGetTenantId()`: Returns undefined if not found

## Best Practices

1. **Use safe methods** (`tryGet*`) when values might not be available
2. **Use strict methods** (`get*`) when values are required
3. **Initialize context early** in the request lifecycle
4. **Handle errors gracefully** in service layers
5. **Use server actions** for client component integration

## Migration Guide

### From Manual Context Creation

**Before:**

```typescript
const context = RequestContext.fromRequest(request, () => {
  // handler logic
});
```

**After:**

```typescript
// Context is automatically initialized in middleware
async function handler(request: NextRequest) {
  const userId = RequestContext.getUserId();
  // ... your logic
}
```

### From Separate Middleware Files

**Before:**

```typescript
import { withContextAndErrorHandler } from "@/core/middleware/context-middleware";
import { withErrorHandler } from "@/core/middleware/error-handler";
```

**After:**

```typescript
import { withApiHandler } from "@/core/middleware";
```

## Performance Considerations

- Context initialization is lightweight
- AsyncLocalStorage has minimal overhead
- Context data is request-scoped and automatically cleaned up
- No memory leaks or context pollution between requests

## Troubleshooting

### Common Issues

1. **NoContextError**: Ensure middleware is properly configured
2. **ContextKeyError**: Check that the key exists in the context
3. **Missing user data**: Verify authentication middleware is working

### Debugging

```typescript
// Check if context exists
if (RequestContext.hasContext()) {
  console.log("Context available");
}

// Get all context data
const contextData = RequestContext.toJSON();
console.log("Context data:", contextData);
```

## Future Enhancements

- Request tracing and logging
- Performance metrics
- Context validation
- Multi-tenant support improvements
