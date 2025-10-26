import { Err } from "@/types/errors";
import { NextRequest } from "next/server";

/**
 * Abstract base class for all response DTOs
 * Ensures every response DTO has a toJson method for proper API response formatting
 */
export abstract class BaseResponseDto {
    /**
     * Converts the DTO to a JSON-serializable object
     * Must be implemented by all response DTOs
     */
    abstract toJson(): Record<string, unknown>;

    /**
     * Converts the DTO to a JSON string
     * Uses the toJson method internally
     */
    toJsonString(): string {
        return JSON.stringify(this.toJson());
    }

    /**
     * Returns the JSON representation for API responses
     * This method can be overridden if custom formatting is needed
     */
    toResponse(): Record<string, unknown> {
        return this.toJson();
    }
}


/**
 * Abstract base class for all request DTOs
 * Ensures every request DTO has validation and request parsing methods
 */
export abstract class BaseRequestDto {
    /**
     * Validates the request data
     * Must be implemented by all request DTOs
     */
    abstract validate(): void;

    /**
     * Helper method to safely parse JSON from request body
     * Throws validation error if parsing fails
     */
    protected static async parseRequestBody(request: NextRequest): Promise<Record<string, unknown>> {
        try {
            return await request.json();
        } catch {
            throw new Error('Invalid JSON in request body');
        }
    }

    /**
     * Helper method to validate required fields
     * Throws validation error if any required field is missing
     */
    protected static validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): void {
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                Err.validation(`${field} is required`)
                    .throw();
            }
        }
    }
}