# API Routes & Handlers Guide

This comprehensive guide covers how to define API routes and handlers in this Next.js application, following our established patterns and best practices.

---

## 📋 **Table of Contents**

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Handler Patterns](#handler-patterns)
4. [Request/Response DTOs](#requestresponse-dtos)
5. [Service Layer Integration](#service-layer-integration)
6. [Error Handling](#error-handling)
7. [Authentication & Authorization](#authentication--authorization)
8. [Request Context Usage](#request-context-usage)
9. [Best Practices](#best-practices)
10. [Examples](#examples)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 **Quick Start**

### Basic API Route Structure

```typescript
// src/app/api/example/route.ts
import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { ExampleServiceImpl } from "@/service";
import RequestContext from "@/core/context/context";

async function exampleHandler(request: NextRequest) {
  await ensureBootstrap();

  // Access request context
  const userId = RequestContext.getUserId();

  // Get service dependencies
  const params = getRepoParams();
  const exampleService = new ExampleServiceImpl(params);

  // Your business logic here
  const result = await exampleService.doSomething();

  return result;
}

export const GET = withApiHandler(exampleHandler);
export const POST = withApiHandler(exampleHandler);
```

---

## 🏗️ **Project Structure**

### Directory Layout

```
src/
├── app/api/                    # Next.js API routes
│   ├── auth/                   # Authentication endpoints
│   ├── users/                  # User management endpoints
│   ├── health/                 # System health endpoints
│   └── test-context/           # Testing endpoints
├── core/
│   ├── middleware/             # Middleware utilities
│   ├── context/                # Request context system
│   ├── di/                     # Dependency injection
│   └── supabase/               # Supabase client configuration
├── domain/
│   ├── dto/                    # Data Transfer Objects
│   ├── entities/               # Domain entities
│   └── repository/             # Repository interfaces
├── service/                    # Business logic services
└── types/                      # Type definitions
```

### File Naming Conventions

- **API Routes**: `route.ts` (Next.js convention)
- **DTOs**: `*.ts` with descriptive names (e.g., `SignupRequest`, `UserResponse`)
- **Services**: `*.ts` with `Impl` suffix (e.g., `UserServiceImpl`)
- **Entities**: `*.ts` with `Entity` suffix (e.g., `UserEntity`)

---

## 🔧 **Handler Patterns**

### 1. **Basic Handler Pattern**

```typescript
import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";

async function basicHandler(request: NextRequest) {
  await ensureBootstrap();

  // Handler logic here
  return { message: "Success" };
}

export const GET = withApiHandler(basicHandler);
```

### 2. **Handler with Request Body**

```typescript
import { CreateUserRequest } from "@/domain";

async function createUserHandler(request: NextRequest) {
  await ensureBootstrap();

  // Parse and validate request body
  const createRequest = await CreateUserRequest.fromRequest(request);

  // Business logic
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);
  const result = await userService.createUser(createRequest);

  return result;
}

export const POST = withApiHandler(createUserHandler);
```

### 3. **Handler with Path Parameters**

```typescript
async function getUserHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await ensureBootstrap();

  const userId = context.params.id;
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const user = await userService.getUserById(userId);
  return user;
}

export const GET = withApiHandler(getUserHandler);
```

### 4. **Handler with Query Parameters**

```typescript
async function searchUsersHandler(request: NextRequest) {
  await ensureBootstrap();

  const url = new URL(request.url);
  const searchTerm = url.searchParams.get("q");
  const page = url.searchParams.get("page") || "1";

  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const results = await userService.searchUsers(searchTerm, parseInt(page));
  return results;
}

export const GET = withApiHandler(searchUsersHandler);
```

### 5. **Handler with Custom Response**

```typescript
import { NextResponse } from "next/server";

async function customResponseHandler(request: NextRequest) {
  await ensureBootstrap();

  // Custom response with specific status code
  return NextResponse.json(
    { message: "Created successfully" },
    { status: 201 }
  );
}

export const POST = withApiHandler(customResponseHandler);
```

---

## 📦 **Request/Response DTOs**

### Request DTO Pattern

```typescript
// src/domain/dto/user.ts
import { BaseRequestDto } from "./base";
import { NextRequest } from "next/server";

export class CreateUserRequest extends BaseRequestDto {
  readonly name: string;
  readonly email: string;
  readonly tenantId?: string;

  constructor(name: string, email: string, tenantId?: string) {
    super();
    this.name = name;
    this.email = email;
    this.tenantId = tenantId;
    this.validate();
  }

  static async fromRequest(request: NextRequest): Promise<CreateUserRequest> {
    const body = await request.json();
    return new CreateUserRequest(body.name, body.email, body.tenant_id);
  }

  validate(): void {
    BaseRequestDto.validateRequiredFields(
      { name: this.name, email: this.email },
      ["name", "email"]
    );

    if (!this.email.includes("@")) {
      Err.validation("Invalid email format")
        .withDetails({ email: this.email })
        .throw();
    }
  }

  toDomain(): UserEntity {
    return UserEntity.create({
      name: this.name,
      email: this.email,
      // ... other fields
    });
  }
}
```

### Response DTO Pattern

```typescript
// src/domain/dto/user.ts
import { BaseResponseDto } from "./base";

export class UserResponse extends BaseResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;

  constructor(id: string, name: string, email: string, createdAt: Date) {
    super();
    this.id = id;
    this.name = name;
    this.email = email;
    this.createdAt = createdAt;
  }

  toJson(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      created_at: this.createdAt.toISOString(),
    };
  }

  static fromEntity(entity: UserEntity): UserResponse {
    return new UserResponse(
      entity.id,
      entity.name,
      entity.email,
      entity.createdAt
    );
  }
}
```

---

## 🏢 **Service Layer Integration**

### Service Interface Pattern

```typescript
// src/service/user.ts
import { RepoParams } from "@/core/di";
import { CreateUserRequest, UserResponse } from "@/domain";

export interface UserService {
  createUser(request: CreateUserRequest): Promise<UserResponse>;
  getUserById(id: string): Promise<UserResponse>;
  getCurrentUser(): Promise<UserResponse>;
}

export class UserServiceImpl implements UserService {
  constructor(private readonly params: RepoParams) {}

  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    request.validate();

    const userEntity = request.toDomain();
    const { data, error } = await this.params.userRepository.create(userEntity);

    if (error) throw error;

    return UserResponse.fromEntity(data);
  }

  async getUserById(id: string): Promise<UserResponse> {
    const { data, error } = await this.params.userRepository.findById(id);

    if (error) throw error;
    if (!data) {
      Err.notFound("User not found").throw();
    }

    return UserResponse.fromEntity(data);
  }

  async getCurrentUser(): Promise<UserResponse> {
    const userId = RequestContext.getUserId();
    return this.getUserById(userId);
  }
}
```

### Handler with Service Integration

```typescript
async function createUserHandler(request: NextRequest) {
  await ensureBootstrap();

  // Parse request
  const createRequest = await CreateUserRequest.fromRequest(request);

  // Get service
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  // Execute business logic
  const result = await userService.createUser(createRequest);

  return result;
}

export const POST = withApiHandler(createUserHandler);
```

---

## ⚠️ **Error Handling**

### Automatic Error Handling

The `withApiHandler` wrapper automatically handles errors and converts them to appropriate HTTP responses:

```typescript
async function handlerWithErrors(request: NextRequest) {
  await ensureBootstrap();

  // These will be automatically caught and handled
  throw Err.validation("Invalid input");
  throw Err.notFound("Resource not found");
  throw Err.unauthorized("Access denied");

  // Database errors are also handled
  const { error } = await this.params.userRepository.create(user);
  if (error) throw error;
}

export const POST = withApiHandler(handlerWithErrors);
```

### Custom Error Responses

```typescript
import { NextResponse } from "next/server";

async function customErrorHandler(request: NextRequest) {
  await ensureBootstrap();

  try {
    // Your logic here
    return { success: true };
  } catch (error) {
    // Custom error handling
    return NextResponse.json(
      { error: "Custom error message" },
      { status: 400 }
    );
  }
}

export const POST = withApiHandler(customErrorHandler);
```

---

## 🔐 **Authentication & Authorization**

### Public Routes

Routes that don't require authentication should be added to the public routes list:

```typescript
// src/core/middleware/middleware.ts
export const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/auth/signup",
  "/api/auth/login",
  "/api/public-endpoint", // Add your public route here
] as const;
```

### Protected Routes

All other routes are automatically protected. The middleware will:

1. Check for authentication
2. Set user context
3. Redirect unauthenticated requests

```typescript
async function protectedHandler(request: NextRequest) {
  await ensureBootstrap();

  // User is guaranteed to be authenticated
  const userId = RequestContext.getUserId();
  const userEmail = RequestContext.getUserEmail();
  const tenantId = RequestContext.tryGetTenantId();

  // Your protected logic here
  return { userId, userEmail, tenantId };
}

export const GET = withApiHandler(protectedHandler);
```

---

## 🌐 **Request Context Usage**

### Accessing User Information

```typescript
import RequestContext from "@/core/context/context";

async function contextAwareHandler(request: NextRequest) {
  await ensureBootstrap();

  // Safe access (returns undefined if not available)
  const userId = RequestContext.tryGetUserId();
  const userEmail = RequestContext.tryGetUserEmail();
  const tenantId = RequestContext.tryGetTenantId();

  // Strict access (throws error if not available)
  const strictUserId = RequestContext.getUserId();
  const strictUserEmail = RequestContext.getUserEmail();

  // Context flags
  const hasUser = RequestContext.hasUser();
  const hasTenant = RequestContext.hasTenant();

  // Request metadata
  const requestId = RequestContext.getRequestId();
  const requestPath = RequestContext.getRequestPath();
  const executionTime = RequestContext.getRequestExecutionTime();

  return {
    user: { userId, userEmail, tenantId },
    context: { hasUser, hasTenant, requestId, executionTime },
  };
}

export const GET = withApiHandler(contextAwareHandler);
```

### Context in Service Layer

```typescript
export class UserServiceImpl implements UserService {
  async getCurrentUser(): Promise<UserResponse> {
    // Access context in service layer
    const userId = RequestContext.getUserId();
    const tenantId = RequestContext.tryGetTenantId();

    // Use context for business logic
    const { data, error } = await this.params.userRepository.findById(userId);

    if (error) throw error;
    if (!data) {
      Err.notFound("User not found").throw();
    }

    return UserResponse.fromEntity(data);
  }
}
```

---

## ✅ **Best Practices**

### 1. **Always Use withApiHandler**

```typescript
// ✅ Good
export const GET = withApiHandler(handler);

// ❌ Bad
export async function GET(request: NextRequest) {
  // Manual error handling required
}
```

### 2. **Bootstrap Early**

```typescript
// ✅ Good
async function handler(request: NextRequest) {
  await ensureBootstrap();
  // ... rest of handler
}

// ❌ Bad
async function handler(request: NextRequest) {
  // ... handler logic
  await ensureBootstrap(); // Too late
}
```

### 3. **Validate Input Early**

```typescript
// ✅ Good
async function handler(request: NextRequest) {
  await ensureBootstrap();

  const dto = await CreateUserRequest.fromRequest(request);
  dto.validate(); // Validation happens in constructor

  // ... rest of handler
}
```

### 4. **Use Type-Safe DTOs**

```typescript
// ✅ Good
const createRequest = await CreateUserRequest.fromRequest(request);

// ❌ Bad
const body = await request.json();
const name = body.name; // No type safety
```

### 5. **Handle Errors Appropriately**

```typescript
// ✅ Good - Let withApiHandler handle it
throw Err.validation("Invalid input");

// ✅ Good - Custom handling when needed
try {
  // risky operation
} catch (error) {
  return NextResponse.json({ error: "Custom message" }, { status: 400 });
}
```

### 6. **Use Request Context**

```typescript
// ✅ Good
const userId = RequestContext.getUserId();

// ❌ Bad
const userId = request.headers.get("x-user-id"); // Manual header access
```

---

## 📚 **Examples**

### Complete CRUD Example

```typescript
// src/app/api/users/route.ts
import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/service";
import { CreateUserRequest, UserResponse } from "@/domain";
import RequestContext from "@/core/context/context";

// GET /api/users - List users
async function listUsersHandler(request: NextRequest) {
  await ensureBootstrap();

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const users = await userService.listUsers(page, limit);
  return users;
}

// POST /api/users - Create user
async function createUserHandler(request: NextRequest) {
  await ensureBootstrap();

  const createRequest = await CreateUserRequest.fromRequest(request);
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const user = await userService.createUser(createRequest);
  return user;
}

export const GET = withApiHandler(listUsersHandler);
export const POST = withApiHandler(createUserHandler);
```

```typescript
// src/app/api/users/[id]/route.ts
import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/service";
import { UpdateUserRequest } from "@/domain";

// GET /api/users/[id] - Get user by ID
async function getUserHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await ensureBootstrap();

  const userId = context.params.id;
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const user = await userService.getUserById(userId);
  return user;
}

// PUT /api/users/[id] - Update user
async function updateUserHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await ensureBootstrap();

  const userId = context.params.id;
  const updateRequest = await UpdateUserRequest.fromRequest(request);

  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  const user = await userService.updateUser(userId, updateRequest);
  return user;
}

// DELETE /api/users/[id] - Delete user
async function deleteUserHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  await ensureBootstrap();

  const userId = context.params.id;
  const params = getRepoParams();
  const userService = new UserServiceImpl(params);

  await userService.deleteUser(userId);
  return { message: "User deleted successfully" };
}

export const GET = withApiHandler(getUserHandler);
export const PUT = withApiHandler(updateUserHandler);
export const DELETE = withApiHandler(deleteUserHandler);
```

### File Upload Example

```typescript
// src/app/api/upload/route.ts
import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap } from "@/core/di";
import RequestContext from "@/core/context/context";

async function uploadHandler(request: NextRequest) {
  await ensureBootstrap();

  const userId = RequestContext.getUserId();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw Err.validation("No file provided");
    }

    // Process file upload
    const uploadResult = await processFileUpload(file, userId);

    return {
      message: "File uploaded successfully",
      fileId: uploadResult.id,
      url: uploadResult.url,
    };
  } catch (error) {
    throw Err.internal("File upload failed").withCause(error);
  }
}

export const POST = withApiHandler(uploadHandler);
```

---

## 🔧 **Troubleshooting**

### Common Issues

#### 1. **Context Not Available**

**Problem**: `RequestContext.getUserId()` throws `NoContextError`

**Solution**: Ensure you're using `withApiHandler` wrapper:

```typescript
// ✅ Correct
export const GET = withApiHandler(handler);

// ❌ Incorrect
export async function GET(request: NextRequest) {
  const userId = RequestContext.getUserId(); // Will throw error
}
```

#### 2. **Bootstrap Not Called**

**Problem**: Dependency injection not working

**Solution**: Call `ensureBootstrap()` at the start of every handler:

```typescript
async function handler(request: NextRequest) {
  await ensureBootstrap(); // Must be first
  // ... rest of handler
}
```

#### 3. **Validation Errors**

**Problem**: DTO validation failing

**Solution**: Check your validation logic and error messages:

```typescript
validate(): void {
    BaseRequestDto.validateRequiredFields(
        { email: this.email },
        ["email"]
    );

    if (!this.email.includes("@")) {
        Err.validation("Invalid email format")
            .withDetails({ email: this.email })
            .throw();
    }
}
```

#### 4. **Type Errors**

**Problem**: TypeScript errors with DTOs

**Solution**: Ensure proper imports and inheritance:

```typescript
import { BaseRequestDto } from "./base";
import { Err } from "@/types";

export class MyRequest extends BaseRequestDto {
  // Implementation
}
```

### Debug Tips

#### 1. **Enable Context Logging**

```typescript
async function debugHandler(request: NextRequest) {
  await ensureBootstrap();

  console.log("Context available:", RequestContext.hasContext());
  console.log("User ID:", RequestContext.tryGetUserId());
  console.log("All context:", RequestContext.toJSON());

  // Your handler logic
}
```

#### 2. **Test Context Route**

Use the built-in test context route to verify everything is working:

```bash
curl http://localhost:3000/api/test-context
```

#### 3. **Check Middleware Logs**

Look for middleware initialization logs in your console:

```
setting request context
user { id: '...', email: '...' }
contextStore { requestId: '...', ... }
```

---

## 🎯 **Summary**

This guide covers the complete API route development workflow:

1. **Structure**: Follow the established directory structure
2. **Handlers**: Use `withApiHandler` wrapper for all routes
3. **DTOs**: Create type-safe request/response objects
4. **Services**: Implement business logic in service layer
5. **Context**: Access user and request data via RequestContext
6. **Errors**: Let the framework handle errors automatically
7. **Validation**: Validate input early and thoroughly

By following these patterns, you'll create consistent, maintainable, and robust API endpoints that integrate seamlessly with the application's architecture.

---

## 📖 **Related Documentation**

- [RequestContext System](./REQUEST_CONTEXT.md) - Detailed context usage
- [Error Handling Standards](./ERROR_HANDLING_STANDARDS.md) - Error handling patterns
- [Middleware Configuration](../src/core/middleware/middleware.ts) - Middleware implementation
- [Service Layer](../src/service/) - Service implementations
- [DTO Patterns](../src/domain/dto/) - Data transfer object examples
