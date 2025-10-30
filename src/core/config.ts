/**
 * Configuration class for managing environment variables
 * 
 * This class centralizes all environment variable access and provides
 * type-safe access to configuration values throughout the application.
 * 
 * Usage:
 *   const config = new Config();
 *   const dbUrl = config.databaseUrl;
 *   const supabaseUrl = config.supabaseUrl;
 */
export class Config {
    // Database Configuration
    public readonly databaseUrl: string;

    // Supabase Configuration
    public readonly supabaseUrl: string;
    public readonly supabaseAnonKey: string;
    public readonly supabaseServiceRoleKey: string;

    // Encryption Configuration
    public readonly encryptionKey: string;

    constructor() {
        // Load and validate database configuration
        this.databaseUrl = this.getRequiredEnv('DATABASE_URL');

        // Load and validate Supabase configuration
        this.supabaseUrl = this.getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
        this.supabaseAnonKey = this.getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        this.supabaseServiceRoleKey = this.getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

        // Load and validate encryption configuration
        this.encryptionKey = this.getRequiredEnv('ENCRYPTION_KEY');
    }

    /**
     * Get a required environment variable
     * Throws an error if the variable is not set
     */
    private getRequiredEnv(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    /**
     * Get an optional environment variable
     * Returns undefined if the variable is not set
     */
    public getOptionalEnv(key: string): string | undefined {
        return process.env[key];
    }
}

