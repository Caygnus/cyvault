.PHONY: swagger swagger-generate swagger-fix-refs swagger-view help

# Swagger/OpenAPI documentation generation

# Generate Swagger JSON and YAML files from codebase
swagger-generate:
	@echo "🔍 Generating Swagger/OpenAPI specification from codebase..."
	@npm run swagger:generate

# Fix allOf references in generated Swagger JSON
swagger-fix-refs:
	@echo "🔧 Fixing Swagger JSON references..."
	@npm run swagger:fix-refs

# Generate and fix Swagger documentation (default swagger target)
swagger: swagger-generate swagger-fix-refs
	@echo "✅ Swagger documentation generation complete!"
	@echo "📄 Files generated in docs/swagger/"

# View Swagger documentation (if Swagger UI is running)
swagger-view:
	@echo "📖 Opening Swagger documentation..."
	@echo "If you have Swagger UI running, visit: http://localhost:3000/api-docs"
	@echo "Or upload docs/swagger/swagger.json to https://editor.swagger.io/"

# Help command
help:
	@echo "Available Swagger/OpenAPI commands:"
	@echo "  make swagger            - Generate and fix Swagger documentation (full pipeline)"
	@echo "  make swagger-generate   - Generate Swagger JSON/YAML from codebase"
	@echo "  make swagger-fix-refs   - Fix allOf references in Swagger JSON"
	@echo "  make swagger-view       - Show instructions for viewing documentation"
	@echo ""
	@echo "The generator automatically:"
	@echo "  - Parses all API route handlers in src/app/api"
	@echo "  - Extracts DTO classes (Request/Response) from src/domain/dto"
	@echo "  - Extracts TypeScript enums from src/types"
	@echo "  - Generates type-safe OpenAPI 3.0 specification"
	@echo "  - Creates both JSON and YAML outputs in docs/swagger/"

