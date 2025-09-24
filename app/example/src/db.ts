import { Pool } from "pg";
import "dotenv/config";

const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
];

for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is not set`);
    }
}

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
