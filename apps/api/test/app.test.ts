
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure we use a test database
const TEST_DB = "file:./test.db";
process.env.DATABASE_URL = TEST_DB;

// Import server after setting env var
// Note: In ESM, static imports happen before this code runs unless we rely on the fact that
// we are not using 'server' until later? No, import happens first.
// BUT 'src/index.ts' imports './db.ts' which does 'new PrismaClient()'.
// 'new PrismaClient()' usually reads env at instantiation.
// So we technically need to set env before import.
// Using dynamic import() is safer.

describe('API Integration Tests', () => {
    let server: any; // Type as FastifyInstance if we have types handy, using any for ease
    let prisma: any;

    beforeAll(async () => {
        console.log("Setting up test database...");
        // Clean up old test db
        if (fs.existsSync('./test.db')) fs.unlinkSync('./test.db');
        if (fs.existsSync('./test.db-journal')) fs.unlinkSync('./test.db-journal');

        // Initialize DB schema
        execSync('npx prisma db push --skip-generate', {
            env: { ...process.env, DATABASE_URL: TEST_DB },
            stdio: 'ignore'
        });

        // Dynamic import to ensure env var is picked up
        const indexModule = await import('../src/index.js');
        server = indexModule.server;

        const dbModule = await import('../src/db.js');
        prisma = dbModule.prisma;

        await server.ready();
    });

    afterAll(async () => {
        if (prisma) await prisma.$disconnect();
        if (server) await server.close();
    });

    it('GET /health returns ok', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/health'
        });
        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.payload)).toEqual({ status: 'ok', service: 'api' });
    });

    it('GET /payments returns array', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/payments'
        });
        expect(response.statusCode).toBe(200);
        const json = JSON.parse(response.payload);
        expect(Array.isArray(json)).toBe(true);
    });

    it('GET /metrics/summary returns valid structure', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/metrics/summary'
        });
        expect(response.statusCode).toBe(200);
        const json = JSON.parse(response.payload);
        expect(json).toHaveProperty('totalPayments');
        expect(json).toHaveProperty('successRate');
    });

    it('GET /metrics/timeseries returns array', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/metrics/timeseries?bucket=day'
        });
        expect(response.statusCode).toBe(200);
        const json = JSON.parse(response.payload);
        expect(Array.isArray(json)).toBe(true);
    });
});
