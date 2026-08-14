import dotenv from 'dotenv';
import { envSchema, EnvConfig } from '../schemas/envSchema.js';

// Load environment variables from .env file
dotenv.config();

const parseEnv = (): EnvConfig => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid Environment Variables Configuration:');
    const formattedErrors = result.error.format();
    
    Object.entries(formattedErrors).forEach(([key, value]) => {
      if (key !== '_errors' && value && '_errors' in value && Array.isArray(value._errors) && value._errors.length > 0) {
        console.error(`   - ${key}: ${value._errors.join(', ')}`);
      }
    });

    throw new Error('Environment configuration validation failed. Please check your .env file.');
  }

  return result.data;
};

export const env = parseEnv();
