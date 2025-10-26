# Error Handling: Industry Standards & Best Practices

This document outlines the error handling standards implemented in this project, based on best practices from major JavaScript projects and industry leaders.

---

## 🎯 **Core Principles**

Our error handling system follows **7 industry-standard best practices**:

### 1. **Appropriate HTTP Status Codes**

We use standard HTTP status codes to clearly communicate error types:

| Code  | Type                  | Usage                                      |
| ----- | --------------------- | ------------------------------------------ |
| `400` | Bad Request           | Validation errors, malformed requests      |
| `401` | Unauthorized          | Authentication required                    |
| `403` | Forbidden             | Insufficient permissions                   |
| `404` | Not Found             | Resource doesn't exist                     |
| `409` | Conflict              | Duplicate resources, constraint violations |
| `429` | Too Many Requests     | Rate limiting                              |
| `500` | Internal Server Error | Server-side failures                       |
| `503` | Service Unavailable   | Database connection issues                 |

**Reference**: [REST API Best Practices](https://www.baeldung.com/rest-api-error-handling-best-practices)

---

### 2. **Structured Error Responses**

All error responses follow a consistent structure:

```typescript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "MACHINE_READABLE_ERROR_CODE",
    statusCode: 400,
    internal_error: "Internal details (dev only)",
    details: {
      field: "email",
      reason: "Invalid format"
    },
    timestamp: "2024-10-26T12:00:00.000Z"
  }
}
```

**Benefits**:

- Consistent client-side error handling
- Easy debugging with structured data
- Machine-readable error codes for automation
- Timestamp for logging and tracking

**Reference**: [Consistent API Error Handling](https://dev.to/zuplo/best-practices-for-consistent-api-error-handling-10d4)

---

### 3. **Centralized Error Handling**

All errors are processed through middleware:

```typescript
// Single middleware handles all errors consistently
export const GET = withApiErrorHandler(async (req) => {
  // Any error thrown here is automatically handled
  throw new Error("Something went wrong");
});
```

**Benefits**:

- No code duplication
- Consistent error formatting
- Single point for logging and monitoring
- Easy to update error handling logic

**Reference**: [Express Error Handling Best Practices](https://stackoverflow.com/questions/72735437/best-practices-for-error-handling-in-rest-apis-with-async-await)

---

### 4. **Custom Error Classes**

We use custom error classes with fluent builders:

```typescript
// Err factory provides type-safe error creation
Err.validation("Invalid email").withDetails({ field: "email" }).throw();
```

**Benefits**:

- Type safety
- Consistent error structure
- Easy to extend
- Self-documenting code

**Reference**: [Custom Error Handling](https://www.syncfusion.com/blogs/post/handling-http-errors-javascript)

---

### 5. **Proper Logging & Monitoring**

All errors are logged with context:

```typescript
// Automatic logging with request context
logError(error, "GET /api/users");

// Output includes:
// - Error message
// - Error code
// - Status code
// - Request method and path
// - Stack trace (in development)
// - Timestamp
```

**Benefits**:

- Easy debugging
- Performance monitoring
- Issue tracking
- Audit trails

**Reference**: [Effective API Error Handling](https://dev.to/hedley_balance/effective-api-error-handling-2272)

---

### 6. **Async Error Handling**

All async operations are wrapped in try/catch:

```typescript
// Middleware automatically handles async errors
export const GET = withApiErrorHandler(async (req) => {
  const user = await findUser(id); // Errors are caught automatically
  return user;
});
```

**Benefits**:

- No unhandled promise rejections
- Consistent error handling
- Clean code (no manual try/catch everywhere)

**Reference**: [JavaScript Exception Handling](https://bugfender.com/blog/javascript-exception-handling/)

---

### 7. **Meaningful & Secure Error Messages**

Error messages are:

- ✅ **Clear and informative** for users
- ✅ **Actionable** (tell users what to do)
- ✅ **Secure** (no sensitive data exposure)
- ✅ **Environment-aware** (detailed in dev, generic in production)

```typescript
// Development
{
  message: "Database query failed",
  internal_error: "Connection timeout after 5000ms"
}

// Production
{
  message: "An error occurred while processing your request."
  // internal_error is hidden
}
```

**Reference**: [JavaScript Error Handling Patterns](https://dev.to/rohit_singh_ee84e64941db7/javascript-error-handling-patterns-you-must-know-with-examples-best-practices-4kig)

---

## 🔒 **Security Best Practices**

### Sensitive Data Protection

We automatically redact sensitive information:

```typescript
// Input
{
  email: "user@example.com",
  password: "secret123",
  apiKey: "abc123"
}

// Output (sanitized)
{
  email: "user@example.com",
  password: "[REDACTED]",
  apiKey: "[REDACTED]"
}
```

**Protected fields**:

- `password`, `token`, `secret`
- `apiKey`, `api_key`, `authorization`
- `cookie`, `session`, `ssn`
- `creditCard`, `privateKey`, `connectionString`

### Environment-Based Error Details

- **Development**: Full error details, stack traces, internal errors
- **Production**: Generic messages, no sensitive data, sanitized details

---

## 🚀 **Intelligent Error Detection**

Our middleware automatically detects error types based on:

### 1. Error Codes

```typescript
if (code.includes('VALIDATION')) → 400 Validation Error
if (code.includes('NOT_FOUND')) → 404 Not Found
if (code.includes('UNAUTHORIZED')) → 401 Unauthorized
```

### 2. Message Patterns

```typescript
"Email is required" → 400 Validation Error
"User not found" → 404 Not Found
"Database connection failed" → 500 Database Error
```

### 3. Error Details

```typescript
{ field: 'email' } → 400 Validation Error
{ resource: 'User' } → 404 Not Found
{ database: true } → 500 Database Error
```

---

## 📊 **Response Format Standards**

### Success Response

```typescript
{
  success: true,
  data: {
    // Response data
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    message: "User-friendly message",
    code: "ERROR_CODE",
    statusCode: 400,
    internal_error: "Internal details (optional)",
    details: { /* Additional context */ },
    timestamp: "ISO 8601 timestamp"
  }
}
```

---

## 🎓 **Usage Guide**

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                      API Route Layer                         │
│  (withApiErrorHandler wraps all route handlers)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  (Business logic, validation, orchestration)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  (Data access with Go-style error returns)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 **Consolidated Error System**

### **Single Import for Everything**

All error handling is consolidated in `src/types/errors.ts`:

```typescript
import {
  // Types
  AppError,
  ErrorResponse,
  ErrorCode,

  // Classes
  CustomError,
  ErrorBuilder,

  // Factory (Simplified API)
  Err,

  // Type Guards
  is,

  // Utilities
  toAppError,
  toErrorResponse,
  getDisplayMessage,
  getStatusCode,
  getErrorCode,
  withErrorHandling,
  logError,
} from "@/types";
```

---

## 🔨 **Usage in Different Layers**

### **1. API Routes (Next.js Route Handlers)**

Use the middleware to automatically handle all errors:

```typescript
import { withApiErrorHandler } from "@/core/middleware";
import { Err } from "@/types";

// Basic usage - automatic error handling
export const GET = withApiErrorHandler(async (req) => {
  // Any error thrown is automatically caught and formatted
  throw new Error("User not found"); // → Becomes 404
});

// With validation
export const POST = withApiErrorHandler(async (req) => {
  const body = await req.json();

  if (!body.email) {
    Err.validation("Email is required").withDetails({ field: "email" }).throw();
  }

  return { success: true, user: body };
});

// With dynamic route params
export const DELETE = withApiErrorHandler(async (req, { params }) => {
  const { id } = params;

  if (!id) {
    Err.notFound("User").throw();
  }

  // Delete logic
  return { message: "User deleted" };
});
```

---

### **2. Repository Layer (Data Access)**

Repositories return **Go-style tuples**: `[data, error]`

```typescript
import { AppError, Err, withErrorHandling } from "@/types";

export interface UserRepository {
  create(user: UserEntity): Promise<[UserEntity | null, AppError | null]>;
  findById(id: string): Promise<[UserEntity | null, AppError | null]>;
  findAll(filter?: Filter): Promise<[UserEntity[], AppError | null]>;
  update(user: UserEntity): Promise<[UserEntity | null, AppError | null]>;
  delete(id: string): Promise<[void, AppError | null]>;
}

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<[UserEntity | null, AppError | null]> {
    return withErrorHandling(async () => {
      try {
        const [result] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, id));

        return [result ? UserEntity.fromDB(result) : null, null] as const;
      } catch (error) {
        throw Err.database("Failed to find user by ID", error as Error)
          .withDetails({ userId: id })
          .build();
      }
    });
  }

  async create(
    user: UserEntity
  ): Promise<[UserEntity | null, AppError | null]> {
    return withErrorHandling(async () => {
      try {
        const [created] = await this.db
          .insert(users)
          .values(user.toUserDB())
          .returning();

        return [UserEntity.fromDB(created), null] as const;
      } catch (error) {
        // Check for unique constraint violations
        if ((error as any).code === "23505") {
          throw Err.conflict("User with this email already exists")
            .withDetails({ email: user.email })
            .build();
        }

        throw Err.database("Failed to create user", error as Error)
          .withDetails({ userId: user.id })
          .build();
      }
    });
  }
}
```

**Why Go-style returns?**

- ✅ Explicit error handling
- ✅ No exceptions in normal flow
- ✅ Type-safe error checking
- ✅ Clear separation of success/failure paths

---

### **3. Service Layer (Business Logic)**

Services orchestrate repositories and handle business rules:

```typescript
import { AppError, Err } from "@/types";
import { UserRepository } from "@/domain/repository";

export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getUserById(id: string): Promise<UserEntity> {
    // Destructure Go-style return
    const [user, error] = await this.userRepo.findById(id);

    // Handle error
    if (error) {
      throw error; // Already properly formatted
    }

    // Check if not found
    if (!user) {
      Err.notFound("User", id).throw();
    }

    return user;
  }

  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    // Validate DTO
    this.validateCreateUserDTO(data);

    // Check if user exists
    const [existing] = await this.userRepo.findByEmail(data.email);
    if (existing) {
      Err.conflict("User with this email already exists")
        .withDetails({ email: data.email })
        .throw();
    }

    // Create entity
    const user = UserEntity.create(data);

    // Save to database
    const [created, error] = await this.userRepo.create(user);

    if (error) {
      throw error;
    }

    return created!;
  }

  private validateCreateUserDTO(data: CreateUserDTO): void {
    if (!data.email || !data.email.includes("@")) {
      Err.validation("Invalid email format")
        .withDetails({ field: "email", value: data.email })
        .throw();
    }

    if (!data.password || data.password.length < 8) {
      Err.validation("Password must be at least 8 characters")
        .withDetails({ field: "password", minLength: 8 })
        .throw();
    }
  }
}
```

---

### **4. DTOs (Data Transfer Objects)**

DTOs can have validation methods that throw errors:

```typescript
import { Err } from "@/types";

export class CreateUserDTO {
  email: string;
  password: string;
  name?: string;

  constructor(data: any) {
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
  }

  validate(): void {
    const errors: Record<string, string> = {};

    // Email validation
    if (!this.email) {
      errors.email = "Email is required";
    } else if (!this.email.includes("@")) {
      errors.email = "Invalid email format";
    }

    // Password validation
    if (!this.password) {
      errors.password = "Password is required";
    } else if (this.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // If there are errors, throw
    if (Object.keys(errors).length > 0) {
      Err.validation("Validation failed")
        .withDetails({ fields: errors })
        .throw();
    }
  }

  static fromRequest(body: any): CreateUserDTO {
    const dto = new CreateUserDTO(body);
    dto.validate(); // Validate immediately
    return dto;
  }
}
```

---

### **5. Entities (Domain Models)**

Entities can validate invariants and throw errors:

```typescript
import { Err } from "@/types";

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly status: EntityStatus
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      Err.validation("User ID is required").throw();
    }

    if (!this.email || !this.email.includes("@")) {
      Err.validation("Valid email is required")
        .withDetails({ email: this.email })
        .throw();
    }
  }

  deactivate(): void {
    if (this.status === EntityStatus.DELETED) {
      Err.conflict("Cannot deactivate a deleted user")
        .withDetails({ userId: this.id, status: this.status })
        .throw();
    }

    // Update status logic
  }

  static create(data: CreateUserDTO): UserEntity {
    return new UserEntity(
      generateId(),
      data.email,
      data.name || "Unknown",
      EntityStatus.PUBLISHED
    );
  }
}
```

---

## 🎯 **Complete Example: User Creation Flow**

### **1. API Route**

```typescript
// src/app/api/users/route.ts
import { withApiErrorHandler } from "@/core/middleware";
import { CreateUserDTO } from "@/domain/dtos";
import { UserService } from "@/domain/services";

const userService = new UserService(/* inject repo */);

export const POST = withApiErrorHandler(async (req) => {
  const body = await req.json();

  // Validate and create DTO
  const dto = CreateUserDTO.fromRequest(body);

  // Create user through service
  const user = await userService.createUser(dto);

  return {
    success: true,
    user: user.toJSON(),
  };
});
```

### **2. Service Layer**

```typescript
// src/domain/services/UserService.ts
export class UserService {
  async createUser(data: CreateUserDTO): Promise<UserEntity> {
    // Check for existing user
    const [existing] = await this.userRepo.findByEmail(data.email);

    if (existing) {
      Err.conflict("User already exists")
        .withDetails({ email: data.email })
        .throw();
    }

    // Create entity (validates invariants)
    const user = UserEntity.create(data);

    // Save to database
    const [created, error] = await this.userRepo.create(user);

    if (error) throw error;

    return created!;
  }
}
```

### **3. Repository Layer**

```typescript
// src/domain/repository/User.ts
export class UserRepositoryImpl implements UserRepository {
  async create(
    user: UserEntity
  ): Promise<[UserEntity | null, AppError | null]> {
    return withErrorHandling(async () => {
      try {
        const [created] = await this.db
          .insert(users)
          .values(user.toUserDB())
          .returning();

        return [UserEntity.fromDB(created), null] as const;
      } catch (error) {
        throw Err.database("Failed to create user", error as Error)
          .withDetails({ userId: user.id })
          .build();
      }
    });
  }
}
```

---

## 🛠️ **Error Factory Methods**

The `Err` factory provides convenient methods:

```typescript
// Validation errors
Err.validation("Email is required").throw();
Err.validation("Invalid format").withDetails({ field: "email" }).throw();

// Not found errors
Err.notFound("User").throw();
Err.notFound("User", userId).throw(); // Includes ID in message

// Authorization errors
Err.unauthorized().throw(); // Default message
Err.unauthorized("Invalid credentials").throw();
Err.forbidden("Insufficient permissions").throw();

// Conflict errors
Err.conflict("Email already exists").withDetails({ email }).throw();

// Database errors
Err.database("Query failed", originalError).throw();

// Internal errors
Err.internal("Unexpected error", originalError).throw();
```

---

## 🔗 **Error Builder Chain**

For complex errors, use the builder:

```typescript
ErrorBuilder.new(ErrorCode.VALIDATION_ERROR, "Validation failed")
  .withMessage("Internal validation error in user service")
  .withDetails({
    fields: { email: "Invalid format", password: "Too short" },
    attemptedValue: sanitizedData,
  })
  .withCause(originalError)
  .throw();
```

---

## ✅ **Best Practices Summary**

### **DO:**

- ✅ Use `Err` factory for common errors
- ✅ Return `[data, error]` tuples from repositories
- ✅ Validate DTOs before processing
- ✅ Add context with `.withDetails()`
- ✅ Wrap route handlers with `withApiErrorHandler`
- ✅ Log errors with context using `logError()`
- ✅ Check for specific database errors (constraints, etc.)

### **DON'T:**

- ❌ Expose sensitive data in error messages
- ❌ Return raw database errors to clients
- ❌ Throw generic `Error()` without context
- ❌ Forget to check error in Go-style returns
- ❌ Skip validation in DTOs
- ❌ Ignore error logging

---

## 🔗 **References**

1. [REST API Error Handling Best Practices](https://www.baeldung.com/rest-api-error-handling-best-practices)
2. [Consistent API Error Handling](https://dev.to/zuplo/best-practices-for-consistent-api-error-handling-10d4)
3. [Express Error Handling](https://stackoverflow.com/questions/72735437/best-practices-for-error-handling-in-rest-apis-with-async-await)
4. [HTTP Error Handling in JavaScript](https://www.syncfusion.com/blogs/post/handling-http-errors-javascript)
5. [Effective API Error Handling](https://dev.to/hedley_balance/effective-api-error-handling-2272)
6. [JavaScript Exception Handling](https://bugfender.com/blog/javascript-exception-handling/)
7. [Error Handling Patterns](https://dev.to/rohit_singh_ee84e64941db7/javascript-error-handling-patterns-you-must-know-with-examples-best-practices-4kig)

---

## ✅ **Compliance Checklist**

- [x] Appropriate HTTP status codes
- [x] Structured, consistent error responses
- [x] Centralized error handling middleware
- [x] Custom error classes with builders
- [x] Comprehensive logging and monitoring
- [x] Async/await error handling
- [x] Meaningful, secure error messages
- [x] Environment-based error details
- [x] Sensitive data sanitization
- [x] Intelligent error type detection
- [x] Machine-readable error codes
- [x] ISO 8601 timestamps
- [x] Stack traces (development only)
- [x] Go-style error returns in repositories
- [x] DTO validation with errors
- [x] Entity invariant validation

---

**Our implementation meets or exceeds industry standards for production-grade API error handling.** 🎉
