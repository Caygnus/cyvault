# Simple JSDoc API Annotations Guide

This guide explains how to document your API endpoints using simple, minimal JSDoc annotations (inspired by Go swag).

## Overview

Use simple one-line annotations directly above your handler functions. The generator parses these and automatically:

- ✅ Extracts DTO schemas from TypeScript types
- ✅ Extracts enums from TypeScript
- ✅ Generates full OpenAPI specification

## Basic Format

```typescript
// handlerName handles the description
// @Summary Brief description
// @Description Detailed description
// @Tags TagName
// @Accept json
// @Produce json
// @Param body body RequestDto true "Description"
// @Success 200 {object} ResponseDto
// @Failure 400 {object} ErrorResponse
// @Router /api/v1/endpoint [post]
async function handlerName(request: NextRequest) {
  // Implementation
}
```

## Complete Example

```typescript
// createVaultHandler handles the creation of a new vault
// @Summary Create a new vault
// @Description Creates a new vault with the provided details
// @Tags Vaults
// @Security bearerAuth
// @Accept json
// @Produce json
// @Param body body VaultRequest true "Vault details"
// @Success 201 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Router /api/v1/vaults [post]
async function createVaultHandler(request: NextRequest) {
  // Implementation
}
```

## Annotation Reference

### Required Annotations

- `@Summary` - One-line description of the endpoint
- `@Router` - Route path and HTTP method: `/api/path [method]`

### Common Annotations

| Annotation     | Format                                      | Example                                   | Description                |
| -------------- | ------------------------------------------- | ----------------------------------------- | -------------------------- |
| `@Summary`     | `@Summary text`                             | `@Summary Create a vault`                 | Brief endpoint description |
| `@Description` | `@Description text`                         | `@Description Creates vault with details` | Detailed explanation       |
| `@Tags`        | `@Tags Tag1,Tag2`                           | `@Tags Vaults`                            | Categories for grouping    |
| `@Security`    | `@Security bearerAuth`                      | `@Security bearerAuth`                    | Authentication required    |
| `@Accept`      | `@Accept json`                              | `@Accept json`                            | Request content type       |
| `@Produce`     | `@Produce json`                             | `@Produce json`                           | Response content type      |
| `@Param`       | `@Param location name type required "desc"` | See Parameters section                    | Request parameters         |
| `@Success`     | `@Success code {type} description`          | `@Success 200 {object} ResponseDto`       | Success response           |
| `@Failure`     | `@Failure code {type} description`          | `@Failure 400 {object} ErrorResponse`     | Error response             |
| `@Router`      | `@Router /path [method]`                    | `@Router /api/v1/vaults [post]`           | Route path and method      |

## Parameters

Use `@Param` to document request parameters:

### Format

```
@Param {location} {name} {type} {required} "{description}"
```

### Locations

- `body` - Request body (for POST/PUT/PATCH)
- `path` - Path parameter (e.g., `/api/vaults/{id}`)
- `query` - Query parameter (e.g., `?limit=50`)

### Examples

**Request Body:**

```typescript
// @Param body body VaultRequest true "Vault details"
```

**Path Parameter:**

```typescript
// @Param id path string true "Vault unique identifier"
```

**Query Parameters:**

```typescript
// @Param limit query integer false "Number of items to return"
// @Param status query EntityStatus false "Filter by status"
// @Param sort query string false "Sort field"
```

## Responses

### Success Responses

```
@Success {code} {type} {description}
```

**Examples:**

```typescript
// @Success 200 {object} VaultResponse
// @Success 201 {object} VaultResponse
// @Success 200 {object} array "Array of vaults"
```

### Error Responses

```
@Failure {code} {type} {description}
```

**Examples:**

```typescript
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
```

**Common HTTP Status Codes:**

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Using Type References

Reference your DTO classes (auto-extracted from TypeScript):

```typescript
// @Param body body VaultRequest true "Vault details"
// @Success 201 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
```

**Available Auto-Generated Types:**

- Request DTOs: `SignupRequest`, `VaultRequest`, `VaultUpdateRequest`, etc.
- Response DTOs: `SignupResponse`, `VaultResponse`, `UserResponse`, etc.
- Enums: `EntityStatus`, `SortOrder`
- Common: `ErrorResponse`

## Complete Examples

### GET Endpoint with Query Parameters

```typescript
// listVaultsHandler retrieves a paginated list of vaults
// @Summary List vaults with filtering
// @Tags Vaults
// @Security bearerAuth
// @Produce json
// @Param limit query integer false "Number of items"
// @Param status query EntityStatus false "Filter by status"
// @Success 200 {object} array "Array of vaults"
// @Failure 400 {object} ErrorResponse
// @Router /api/v1/vaults [get]
```

### POST Endpoint with Request Body

```typescript
// createVaultHandler handles the creation of a new vault
// @Summary Create a new vault
// @Tags Vaults
// @Security bearerAuth
// @Accept json
// @Produce json
// @Param body body VaultRequest true "Vault details"
// @Success 201 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
// @Router /api/v1/vaults [post]
```

### Path Parameter Endpoint

```typescript
// getVaultHandler retrieves a vault by ID
// @Summary Get vault by ID
// @Tags Vaults
// @Security bearerAuth
// @Produce json
// @Param id path string true "Vault unique identifier"
// @Success 200 {object} VaultResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/vaults/{id} [get]
```

### PUT Endpoint with Path + Body

```typescript
// updateVaultHandler handles updating a vault
// @Summary Update a vault
// @Tags Vaults
// @Security bearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Vault ID"
// @Param body body VaultUpdateRequest true "Updated details"
// @Success 200 {object} VaultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/vaults/{id} [put]
```

## Best Practices

1. **Always include `@Summary` and `@Router`** - These are required
2. **Document all responses** - Include success and common error codes
3. **Use type references** - Reference DTO classes instead of inline types
4. **Group by tags** - Use consistent tags to group related endpoints
5. **Specify security** - Mark protected endpoints with `@Security bearerAuth`
6. **Update when code changes** - Keep annotations in sync with implementation

## Generating the Spec

After adding annotations, run:

```bash
npm run swagger
```

Or:

```bash
make swagger
```

This will:

1. Parse all simple JSDoc annotations from route handlers
2. Auto-extract DTO schemas and enums from TypeScript
3. Generate `docs/swagger/swagger.json` and `swagger.yaml`
4. Fix schema references

## Troubleshooting

### Annotation Not Appearing

- Ensure comments start with `//` (single line comments)
- Check that annotations are directly above the handler function
- Verify `@Router` format: `/api/path [method]` with brackets

### Type Reference Not Found

- Verify the DTO class name matches exactly (case-sensitive)
- Check that the DTO is in `src/domain/dto/*.ts`
- DTOs are auto-extracted - no manual schema definition needed

### Path Not Generated

- Verify `@Router` format is correct: `/api/v1/path [post]`
- Ensure the method is in brackets: `[get]`, `[post]`, `[put]`, `[delete]`
- Check that comments are directly above the handler
