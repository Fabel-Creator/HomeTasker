// Alternative database configuration for local development
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for local development
neonConfig.webSocketConstructor = ws;

// For local development, you can either:
// 1. Use a local PostgreSQL instance
// 2. Use a managed PostgreSQL service like Neon, Supabase, or Railway
// 3. Use the same Neon database as Replit (just copy the DATABASE_URL)

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL must be set for local development. 
    
Options:
1. Copy DATABASE_URL from your Replit project
2. Set up local PostgreSQL: "postgresql://user:password@localhost:5432/dbname"
3. Use managed service: Neon, Supabase, Railway etc.
4. For testing, use in-memory database (see storage.ts)`
  );
}

// Use the same database setup as the main app
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });