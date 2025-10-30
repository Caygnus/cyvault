#!/usr/bin/env node
/**
 * Automated OpenAPI/Swagger Spec Generator
 * 
 * Parses simple JSDoc annotations (like Go swag) and automatically extracts
 * DTO schemas and enums from TypeScript code.
 */

import swaggerJSDoc from "swagger-jsdoc";
import { Project, Node, Type, TypeChecker } from "ts-morph";
import { readdirSync, existsSync, writeFileSync } from "fs";
import { join, resolve, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

// Initialize TypeScript project for schema extraction
const project = new Project({
    tsConfigFilePath: join(rootDir, "tsconfig.json"),
});

// Parse simple annotation format to OpenAPI format
function parseSimpleAnnotations(comments: string, filePath: string): { path: string; method: string; operation: Record<string, unknown> } | null {
    // Extract the route path and method from file path
    const relativePath = relative(join(rootDir, "src/app/api"), filePath);
    let routePath = "/api/" + relativePath
        .replace(/\/route\.ts$/, "")
        .replace(/\[(\w+)\]/g, "{$1}")
        .replace(/\/$/, "");

    // Find handler function to extract method from exports
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) return null;

    const lines = comments.split('\n').map(l => l.trim());

    // Parse simple format
    let summary = '';
    let description = '';
    let tags: string[] = [];
    let tagsStr = '';
    const security: string[] = [];
    let paramBody: string | null = null;
    const paramPath: Array<{ name: string, type: string, required: boolean, description: string }> = [];
    const paramQuery: Array<{ name: string, type: string, required: boolean, description: string }> = [];
    const success: Record<string, { code: string, type: string, description?: string }> = {};
    const failure: Record<string, { code: string, type: string, description?: string }> = {};
    let router = '';
    let method = '';

    for (const line of lines) {
        if (line.startsWith('// @Summary')) {
            summary = line.replace('// @Summary', '').trim();
        } else if (line.startsWith('// @Description')) {
            description = line.replace('// @Description', '').trim();
        } else if (line.startsWith('// @Tags')) {
            tagsStr = line.replace('// @Tags', '').trim();
            tags = tagsStr.split(',').map(t => t.trim());
        } else if (line.startsWith('// @Accept')) {
            // Accept type is parsed but currently not used in OpenAPI generation
            // Can be extended later if needed
        } else if (line.startsWith('// @Produce')) {
            // Produce type is parsed but currently not used in OpenAPI generation
            // Can be extended later if needed
        } else if (line.startsWith('// @Security')) {
            const sec = line.replace('// @Security', '').trim();
            if (sec) security.push(sec);
        } else if (line.startsWith('// @Param')) {
            // Format: @Param {location} {name} {type} {required} "{description}"
            // Examples:
            // @Param body body dto.CreatePriceUnitRequest true "Price unit details"
            // @Param id path string true "Vault ID"
            // @Param limit query integer false "Number of items"
            const paramMatch = line.match(/@Param\s+(\w+)\s+(\w+)\s+(\S+)\s+(\S+)\s+"([^"]+)"/);
            if (paramMatch) {
                const [, location, name, type, required, desc] = paramMatch;
                const param = {
                    name,
                    type: type.includes('.') ? type.split('.').pop()! : type,
                    required: required === 'true',
                    description: desc,
                    fullType: type
                };

                if (location === 'body') {
                    paramBody = type;
                } else if (location === 'path') {
                    paramPath.push(param);
                } else if (location === 'query') {
                    paramQuery.push(param);
                }
            }
        } else if (line.startsWith('// @Success')) {
            // Format: @Success {code} {type} {description}
            // Example: @Success 201 {object} dto.PriceUnitResponse
            const successMatch = line.match(/@Success\s+(\d+)\s+(\S+)\s*(.*)?/);
            if (successMatch) {
                const [, code, type, desc] = successMatch;
                success[code] = {
                    code,
                    type: type.replace(/[{}]/g, ''),
                    description: desc?.trim()
                };
            }
        } else if (line.startsWith('// @Failure')) {
            // Format: @Failure {code} {type} {description}
            const failureMatch = line.match(/@Failure\s+(\d+)\s+(\S+)\s*(.*)?/);
            if (failureMatch) {
                const [, code, type, desc] = failureMatch;
                failure[code] = {
                    code,
                    type: type.replace(/[{}]/g, ''),
                    description: desc?.trim()
                };
            }
        } else if (line.startsWith('// @Router')) {
            // Format: @Router /path [method]
            const routerMatch = line.match(/@Router\s+(\S+)\s+\[(\w+)\]/);
            if (routerMatch) {
                router = routerMatch[1];
                method = routerMatch[2].toLowerCase();
                routePath = router; // Use explicit router path
            }
        }
    }

    // If no router specified, try to infer from exports
    if (!method || !router) {
        const exports = sourceFile.getExportedDeclarations();
        for (const [exportName] of exports) {
            if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(exportName)) {
                method = exportName.toLowerCase();
                break;
            }
        }
    }

    if (!method) return null;

    // Build OpenAPI operation
    const operation: {
        summary: string;
        description: string;
        tags: string[];
        security?: Array<Record<string, unknown[]>>;
        parameters?: Array<Record<string, unknown>>;
        requestBody?: Record<string, unknown>;
        responses: Record<string, Record<string, unknown>>;
    } = {
        summary: summary || 'Endpoint',
        description: description || summary,
        tags: tags.length > 0 ? tags : [routePath.split('/')[2] || 'api'],
        responses: {},
    };

    // Add security
    if (security.length > 0) {
        // Convert security names (e.g., "bearerAuth") to proper format
        operation.security = security.map(sec => {
            const secName = sec === 'ApiKeyAuth' ? 'bearerAuth' : sec.toLowerCase();
            return { [secName]: [] };
        });
    } else {
        // Default to bearerAuth if not specified and not health endpoint
        if (!routePath.includes('/health')) {
            operation.security = [{ bearerAuth: [] }];
        }
    }

    // Add parameters
    const parameters: Array<Record<string, unknown>> = [];

    // Path parameters
    paramPath.forEach(param => {
        parameters.push({
            in: 'path',
            name: param.name,
            required: true,
            schema: { type: param.type === 'string' ? 'string' : param.type },
            description: param.description
        });
    });

    // Query parameters
    paramQuery.forEach(param => {
        parameters.push({
            in: 'query',
            name: param.name,
            required: param.required,
            schema: { type: param.type },
            description: param.description
        });
    });

    if (parameters.length > 0) {
        operation.parameters = parameters;
    }

    // Add request body
    if (paramBody) {
        const schemaRef = paramBody.includes('.')
            ? `#/components/schemas/${paramBody.split('.').pop()}`
            : `#/components/schemas/${paramBody}`;

        operation.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: schemaRef }
                }
            }
        };
    }

    // Add responses (already initialized above)

    // Success responses
    for (const [code, resp] of Object.entries(success)) {
        let schema: Record<string, unknown> | { $ref: string };
        if (resp.type === 'object' && paramBody) {
            // Reference the response DTO
            const refName = paramBody.replace('Request', 'Response');
            schema = { $ref: `#/components/schemas/${refName.split('.').pop()}` };
        } else if (resp.type !== 'object') {
            schema = { type: resp.type };
        } else {
            schema = { type: 'object' };
        }

        operation.responses[code] = {
            description: resp.description || getDefaultResponseDescription(code),
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: schema
                        },
                        required: ['success', 'data']
                    }
                }
            }
        };
    }

    // Failure responses
    for (const [code, resp] of Object.entries(failure)) {
        operation.responses[code] = {
            description: resp.description || getDefaultErrorDescription(code),
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        };
    }

    // Add common error responses if not specified
    if (!operation.responses['400']) {
        operation.responses['400'] = {
            description: 'Bad Request',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        };
    }

    if (!operation.responses['500']) {
        operation.responses['500'] = {
            description: 'Internal Server Error',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        };
    }

    return {
        path: routePath,
        method,
        operation
    };
}

function getDefaultResponseDescription(code: string): string {
    const descriptions: Record<string, string> = {
        '200': 'Success',
        '201': 'Created successfully',
        '204': 'No Content',
    };
    return descriptions[code] || 'Success';
}

function getDefaultErrorDescription(code: string): string {
    const descriptions: Record<string, string> = {
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Not Found',
        '409': 'Conflict',
        '500': 'Internal Server Error',
    };
    return descriptions[code] || 'Error';
}

// Extract JSDoc comments from a file
function extractCommentsFromFile(filePath: string): Array<{ comments: string, handlerName?: string }> {
    const content = readFileSync(filePath, 'utf-8');
    const comments: Array<{ comments: string, handlerName?: string }> = [];

    // Match both formats:
    // 1. Simple format: // @Summary ...
    // 2. Standard JSDoc: /** @swagger ... */

    // Extract simple format comments (lines starting with // @)
    const simpleMatches = [...content.matchAll(/(?:^|\n)\s*\/\/.*?@Summary[^\n]*(?:\n\s*\/\/[^\n]*)*/gm)];

    for (const match of simpleMatches) {
        const commentBlock = match[0].trim();
        if (commentBlock.includes('@Summary') || commentBlock.includes('@Router')) {
            comments.push({ comments: commentBlock });
        }
    }

    // Also extract standard @swagger JSDoc blocks
    const jsdocRegex = /\/\*\*\s*\n\s*\*\s*@swagger[\s\S]*?\*\//g;
    const jsdocMatches = content.matchAll(jsdocRegex);

    for (const match of jsdocMatches) {
        comments.push({ comments: match[0] });
    }

    return comments;
}

// Find all API route files
function findRouteFiles(dir: string): string[] {
    const files: string[] = [];

    function walkDir(currentDir: string) {
        const entries = readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = join(currentDir, entry.name);

            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else if (entry.name === "route.ts") {
                files.push(fullPath);
            }
        }
    }

    walkDir(dir);
    return files;
}

// Extract schemas from DTO classes (automatic type extraction)
function extractDTOSchemas(checker: TypeChecker): Record<string, unknown> {
    const schemas: Record<string, unknown> = {};

    // Find all DTO files
    const dtoFiles = [
        join(rootDir, "src/domain/dto/auth.ts"),
        join(rootDir, "src/domain/dto/user.ts"),
        join(rootDir, "src/domain/dto/vault.ts"),
        join(rootDir, "src/domain/dto/tenant.ts"),
    ];

    for (const filePath of dtoFiles) {
        if (!existsSync(filePath)) continue;

        const sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) continue;

        // Find exported classes
        const classes = sourceFile.getClasses();

        for (const classDecl of classes) {
            const className = classDecl.getName();
            if (!className || (!className.endsWith("Request") && !className.endsWith("Response"))) {
                continue;
            }

            const classType = checker.getTypeAtLocation(classDecl);
            const schema = extractSchema(classType, checker);
            schemas[className] = schema;

            // Add description from JSDoc if available
            const jsDocs = classDecl.getJsDocs();
            if (jsDocs && jsDocs.length > 0) {
                const description = jsDocs[0].getDescription();
                if (description) {
                    schema.description = description;
                }
            }
        }
    }

    // Extract enums
    const enumFiles = [
        join(rootDir, "src/types/base.ts"),
    ];

    for (const filePath of enumFiles) {
        if (!existsSync(filePath)) continue;

        const sourceFile = project.getSourceFile(filePath);
        if (!sourceFile) continue;

        const enums = sourceFile.getEnums();

        for (const enumDecl of enums) {
            const enumName = enumDecl.getName();
            const members = enumDecl.getMembers();

            const enumValues: string[] = [];
            for (const member of members) {
                const initializer = member.getInitializer();
                if (initializer && Node.isStringLiteral(initializer)) {
                    enumValues.push(initializer.getText().replace(/['"]/g, ""));
                } else {
                    const value = member.getValue();
                    if (typeof value === "string") {
                        enumValues.push(value);
                    }
                }
            }

            schemas[enumName] = {
                type: "string",
                enum: enumValues,
                description: `Enum: ${enumName}`,
            };
        }
    }

    // Add common error response schema
    schemas["ErrorResponse"] = {
        type: "object",
        properties: {
            success: { type: "boolean", example: false },
            error: {
                type: "object",
                properties: {
                    code: { type: "string" },
                    message: { type: "string" },
                    details: { type: "object" },
                },
            },
        },
        required: ["success", "error"],
    };

    // Add success response wrapper
    schemas["SuccessResponse"] = {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
        },
        required: ["success", "data"],
    };

    return schemas;
}

// Extract schema from TypeScript type/class
function extractSchema(
    type: Type,
    checker: TypeChecker,
    visited = new Set<string>()
): Record<string, unknown> {
    // Handle primitives
    if (type.isString()) return { type: "string" };
    if (type.isNumber()) return { type: "number" };
    if (type.isBoolean()) return { type: "boolean" };

    // Check for Date type
    const typeText = type.getText();
    if (typeText === "Date" || typeText.includes("Date")) {
        return { type: "string", format: "date-time" };
    }

    // Handle arrays
    if (type.isArray()) {
        const elementType = type.getArrayElementType();
        if (elementType) {
            return {
                type: "array",
                items: extractSchema(elementType, checker, visited),
            };
        }
        return { type: "array", items: { type: "string" } };
    }

    // Handle unions (including enums)
    const unionTypes = type.getUnionTypes();
    if (unionTypes.length > 1) {
        // Check if it's an enum
        const enumValues: string[] = [];
        let isEnum = true;

        for (const unionType of unionTypes) {
            if (unionType.isStringLiteral()) {
                enumValues.push(unionType.getLiteralValue() as string);
            } else {
                isEnum = false;
                break;
            }
        }

        if (isEnum && enumValues.length > 0) {
            return {
                type: "string",
                enum: enumValues,
            };
        }
    }

    // Handle objects/classes
    const symbol = type.getSymbol();
    if (symbol) {
        const symbolName = symbol.getName();

        // Avoid infinite recursion
        if (visited.has(symbolName)) {
            return { $ref: `#/components/schemas/${symbolName}` };
        }
        visited.add(symbolName);

        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        // Get properties from class/interface
        const propertiesSymbol = type.getProperties();

        for (const prop of propertiesSymbol) {
            const propName = prop.getName();

            // Skip methods and internal properties
            if (propName.startsWith("_") ||
                propName === "validate" ||
                propName === "toJson" ||
                propName === "toJsonString" ||
                propName === "toResponse" ||
                propName === "toDomain" ||
                propName === "fromRequest" ||
                propName === "fromDomain") {
                continue;
            }

            const declarations = prop.getDeclarations();
            if (declarations.length === 0) continue;

            // Skip if it's a method (function)
            const firstDecl = declarations[0];
            if (Node.isMethodDeclaration(firstDecl) ||
                (Node.isPropertyDeclaration(firstDecl) &&
                    firstDecl.getInitializer() &&
                    (Node.isFunctionExpression(firstDecl.getInitializer()!) ||
                        Node.isArrowFunction(firstDecl.getInitializer()!)))) {
                continue;
            }

            const propType = checker.getTypeOfSymbolAtLocation(prop, firstDecl);

            // Check if property is optional (has ?)
            let isOptional = false;

            if (Node.isPropertySignature(firstDecl) || Node.isPropertyDeclaration(firstDecl)) {
                isOptional = firstDecl.hasQuestionToken() ||
                    firstDecl.getInitializer() !== undefined ||
                    propType.isNullable() ||
                    propName.includes("?");
            }

            if (!isOptional && !propName.startsWith("_")) {
                required.push(propName);
            }

            const propSchema = extractSchema(propType, checker, new Set(visited));
            properties[propName] = propSchema;
        }

        return {
            type: "object",
            properties,
            required: required.length > 0 ? required : undefined,
        };
    }

    // Fallback
    return { type: "string" };
}

// Generate OpenAPI spec
async function generateOpenAPISpec(): Promise<Record<string, unknown>> {
    const checker = project.getTypeChecker();

    // Find all route files
    const apiDir = join(rootDir, "src/app/api");
    const routeFiles = findRouteFiles(apiDir);

    const paths: Record<string, Record<string, Record<string, unknown>>> = {};

    // Process each route file
    for (const filePath of routeFiles) {
        const comments = extractCommentsFromFile(filePath);

        for (const { comments: commentBlock } of comments) {
            // Try parsing as simple format first
            if (commentBlock.includes('@Summary') || commentBlock.includes('@Router')) {
                const parsed = parseSimpleAnnotations(commentBlock, filePath);
                if (parsed) {
                    if (!paths[parsed.path]) {
                        paths[parsed.path] = {};
                    }
                    paths[parsed.path][parsed.method] = parsed.operation;
                }
            } else if (commentBlock.includes('@swagger')) {
                // Parse as standard swagger-jsdoc format
                const routeFilePaths = [relative(rootDir, filePath)];
                const swaggerOptions = {
                    definition: {
                        openapi: "3.0.0",
                        info: {
                            title: "CyVault API",
                            version: "1.0.0",
                        },
                    },
                    apis: routeFilePaths.map(f => join(rootDir, f)),
                };

                const spec = swaggerJSDoc(swaggerOptions) as { paths?: Record<string, Record<string, Record<string, unknown>>> };
                if (spec.paths) {
                    Object.assign(paths, spec.paths);
                }
            }
        }
    }

    // Build base spec
    const spec: Record<string, unknown> = {
        openapi: "3.0.0",
        info: {
            title: "CyVault API",
            version: "1.0.0",
            description: "Automatically generated OpenAPI specification for CyVault API",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        paths,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {},
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    };

    // Extract schemas from TypeScript DTOs and enums
    const extractedSchemas = extractDTOSchemas(checker);

    // Add schemas to spec
    const components = spec.components as { securitySchemes: unknown; schemas?: Record<string, unknown> };
    components.schemas = {
        ...extractedSchemas,
        ...(components.schemas || {}),
    };

    return spec;
}

// Main execution
async function main() {
    console.log("🔍 Parsing codebase to generate OpenAPI spec...");
    console.log("📝 Using simple JSDoc annotations (Go swag style)");
    console.log("🔧 Auto-extracting DTOs and enums from TypeScript types\n");

    try {
        const spec = await generateOpenAPISpec();

        // Write JSON spec to docs/swagger directory
        const docsDir = join(rootDir, "docs/swagger");
        const fsPromises = await import("fs/promises");
        if (!existsSync(docsDir)) {
            await fsPromises.mkdir(docsDir, { recursive: true });
        }

        const jsonPath = join(docsDir, "swagger.json");
        writeFileSync(jsonPath, JSON.stringify(spec, null, 2));
        console.log(`✅ Generated: ${jsonPath}`);

        // Also write YAML
        try {
            const yaml = await import("yaml");
            const yamlPath = join(docsDir, "swagger.yaml");
            writeFileSync(yamlPath, yaml.stringify(spec));
            console.log(`✅ Generated: ${yamlPath}`);
        } catch {
            console.log("ℹ️  YAML generation skipped");
        }

        const specPaths = spec.paths as Record<string, unknown> | undefined;
        const specComponents = spec.components as { schemas?: Record<string, unknown> } | undefined;

        console.log(`\n📊 Generated spec with:`);
        console.log(`   - ${Object.keys(specPaths || {}).length} paths`);
        console.log(`   - ${Object.keys(specComponents?.schemas || {}).length} schemas`);
        console.log(`\n💡 Use simple annotations like:`);
        console.log(`   // @Summary Create a new vault`);
        console.log(`   // @Tags Vaults`);
        console.log(`   // @Param body body VaultRequest true "Vault details"`);
        console.log(`   // @Success 201 {object} VaultResponse`);
        console.log(`   // @Failure 400 {object} ErrorResponse`);
        console.log(`   // @Router /api/v1/vaults [post]`);

    } catch (error) {
        console.error("❌ Error generating OpenAPI spec:", error);
        process.exit(1);
    }
}

main();
