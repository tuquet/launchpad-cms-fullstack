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
 */
const PLACEHOLDER_REGEX = /tobemodified[a-zA-Z0-9]*/gi;

// Check for force flag in arguments
const IS_FORCE = process.argv.includes('--force') || process.argv.includes('-f');

function copyEnvFile(targetDir: string): void {
  const absoluteTargetDir = path.resolve(targetDir.trim());
  const examplePath = path.join(absoluteTargetDir, '.env.example');
  const envPath = path.join(absoluteTargetDir, '.env');

  const dirName = path.basename(absoluteTargetDir) || 'Root';
  console.log(`\n--- 📂 Processing Environment: ${dirName} ---`);

  // 1. Check if .env.example exists
  if (!fs.existsSync(examplePath)) {
    console.error(`  ❌ [Error] .env.example not found at: ${examplePath}`);
    return;
  }

  // 2. Check if .env already exists (Run-once protection unless --force is used)
  if (fs.existsSync(envPath) && !IS_FORCE) {
    console.log(`  ⏩ [Skip] .env already exists. Use --force to overwrite.`);
    return;
  }

  try {
    // 3. Read example file
    const exampleContent = fs.readFileSync(examplePath, 'utf8');
    let replacementCount = 0;

    // 4. Replace placeholders with unique random secrets
    const updatedContent = exampleContent.replace(PLACEHOLDER_REGEX, (match: string) => {
        replacementCount++;
        return generateSecret();
    });

    // 5. Write the new .env file
    fs.writeFileSync(envPath, updatedContent, 'utf8');
    console.log(`  ✅ [Success] Created .env with ${replacementCount} fresh random secrets.`);

  } catch (error) {
    console.error(`  ❌ [Error] Failed to process ${envPath}:`, error);
  }
}

// Filter out flags and get target paths
const paths = process.argv.slice(2).filter(arg => !arg.startsWith('-'));

if (paths.length > 0) {
  paths.forEach((p: string) => copyEnvFile(p));
} else {
  // Default to root if no path provided
  copyEnvFile('.');
}
