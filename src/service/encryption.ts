import * as crypto from "crypto";
import { Config } from "@/core/config";
import { Err } from "@/types";

// Service interface
export interface IEncryptionService {
    /**
     * Encrypts plaintext using AES-GCM and returns base64-encoded ciphertext
     * @param plaintext The plaintext to encrypt
     * @returns Base64-encoded ciphertext containing nonce and encrypted data
     */
    encrypt(plaintext: string): Promise<string>;

    /**
     * Decrypts base64-encoded ciphertext using AES-GCM
     * @param ciphertext Base64-encoded ciphertext containing nonce and encrypted data
     * @returns The decrypted plaintext
     */
    decrypt(ciphertext: string): Promise<string>;

    /**
     * Creates a one-way hash of the input value using SHA-256
     * @param value The value to hash
     * @returns Hexadecimal string representation of the hash
     */
    hash(value: string): string;
}

export class EncryptionService implements IEncryptionService {
    private readonly key: Buffer;
    private readonly algorithm = "aes-256-gcm";
    private readonly ivLength = 12; // 96 bits for GCM nonce

    constructor(config?: Config) {
        // Create Config instance if not provided (allows for dependency injection or direct instantiation)
        const cfg = config ?? new Config();
        const encryptionKey = cfg.encryptionKey;

        if (!encryptionKey) {
            throw Err.internal("Master encryption key not configured")
                .withHint("Master encryption key is not configured")
                .build();
        }

        // Convert the key to a buffer
        let keyBuffer = Buffer.from(encryptionKey, "utf-8");

        // Ensure the key is exactly 32 bytes (256 bits) for AES-256
        if (keyBuffer.length !== 32) {
            // If not 32 bytes, hash it to get a consistent 32-byte key
            const hasher = crypto.createHash("sha256");
            hasher.update(keyBuffer);
            keyBuffer = hasher.digest();
        }

        this.key = keyBuffer;
    }

    async encrypt(plaintext: string): Promise<string> {
        if (plaintext === "") {
            return "";
        }

        try {
            // Generate a random IV (nonce) for this encryption
            const iv = crypto.randomBytes(this.ivLength);

            // Create the cipher
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

            // Encrypt the plaintext
            let encrypted = cipher.update(plaintext, "utf-8", "base64");
            encrypted += cipher.final("base64");

            // Get the authentication tag
            const authTag = cipher.getAuthTag();

            // Combine IV + authTag + encrypted data
            const combined = Buffer.concat([
                iv,
                authTag,
                Buffer.from(encrypted, "base64"),
            ]);

            // Encode the result as base64 for storage
            return combined.toString("base64");
        } catch (error) {
            throw Err.internal("Failed to encrypt plaintext")
                .withMessage(error instanceof Error ? error.message : "Unknown error")
                .withCause(error instanceof Error ? error : new Error(String(error)))
                .build();
        }
    }

    async decrypt(ciphertext: string): Promise<string> {
        if (ciphertext === "") {
            return "";
        }

        try {
            // Decode the base64-encoded ciphertext
            const combined = Buffer.from(ciphertext, "base64");

            // Extract IV, authTag, and encrypted data
            if (combined.length < this.ivLength + 16) {
                throw Err.internal("Ciphertext too short")
                    .withHint("Ciphertext is too short to contain IV and authentication tag")
                    .build();
            }

            const iv = combined.subarray(0, this.ivLength);
            const authTag = combined.subarray(this.ivLength, this.ivLength + 16);
            const encrypted = combined.subarray(this.ivLength + 16);

            // Create the decipher
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            // Decrypt the ciphertext
            let decrypted = decipher.update(encrypted, undefined, "utf-8");
            decrypted += decipher.final("utf-8");

            return decrypted;
        } catch (error) {
            if (error instanceof Error && error.message.includes("Ciphertext too short")) {
                throw error;
            }

            throw Err.internal("Failed to decrypt ciphertext")
                .withMessage(error instanceof Error ? error.message : "Unknown error")
                .withHint("Failed to decrypt ciphertext. The key may be incorrect or the data may be corrupted.")
                .withCause(error instanceof Error ? error : new Error(String(error)))
                .build();
        }
    }

    hash(value: string): string {
        if (value === "") {
            return "";
        }

        // Create a new SHA-256 hasher
        const hasher = crypto.createHash("sha256");

        // Write the value to the hasher
        hasher.update(value, "utf-8");

        // Get the hash sum and convert to hex string
        return hasher.digest("hex");
    }
}

