/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import process from 'process';

/**
 * Generates a high-entropy random string for security keys
 */
const generateSecret = (bytes = 32) => crypto.randomBytes(bytes).toString('base64');

/**
 * Regex to find placeholders in .env.example
 * Matches 'tobemodified', 'toBeModified', etc.
 */
const PLACEHOLDER_REGEX = /tobemodified[a-zA-Z0-9]*/gi;

function copyEnvFile(targetDir: string): void {
  const absoluteTargetDir = path.resolve(targetDir.trim());
  const examplePath = path.join(absoluteTargetDir, '.env.example');
  const envPath = path.join(absoluteTargetDir, '.env');

  console.log(`\n--- Processing Environment File for: ${path.basename(absoluteTargetDir) || 'Root'} ---`);

  // 1. Check if .env.example exists
  if (!fs.existsSync(examplePath)) {
    console.error(`[Error] .env.example not found at: ${examplePath}`);
    return;
  }

  // 2. Check if .env already exists (Run-once protection)
  if (fs.existsSync(envPath)) {
    console.log(`[Skip] .env already exists at: ${envPath}. No changes made.`);
    return;
  }

  try {
    // 3. Read example file
    const exampleContent = fs.readFileSync(examplePath, 'utf8');

    // 4. Replace placeholders with unique random secrets
    // We use a function callback in .replace() to ensure each replacement gets a NEW unique secret
    const updatedContent = exampleContent.replace(PLACEHOLDER_REGEX, (match: string) => {
        // Special handling for APP_KEYS which usually expect shorter or multiple keys
        // but for Strapi, a 32-byte base64 is excellent for any secret field.
        const secret = generateSecret();
        console.log(`  > Generated new secret for placeholder: ${match}`);
        return secret;
    });

    // 5. Write the new .env file
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log(`[Success] Created ${envPath} with fresh random secrets.`);

  } catch (error) {
    console.error(`[Error] Failed to process ${envPath}:`, error);
  }
}

// Support calling with multiple paths or a single path
const paths = process.argv.slice(2);

if (paths.length > 0) {
  paths.forEach((p: string) => copyEnvFile(p));
} else {
  // Default to root if no path provided
  copyEnvFile('.');
}
