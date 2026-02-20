"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const router_1 = require("../router");
const trpc_1 = require("../trpc");
const createCaller = (0, trpc_1.createCallerFactory)(router_1.appRouter);
const caller = createCaller({});
(0, vitest_1.describe)('userRouter', () => {
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('creates a user with valid data', async () => {
            const result = await caller.user.create({
                email: 'test@example.com',
                name: 'Test User',
            });
            (0, vitest_1.expect)(result.id).toBeDefined();
            (0, vitest_1.expect)(result.email).toBe('test@example.com');
            (0, vitest_1.expect)(result.name).toBe('Test User');
        });
        (0, vitest_1.it)('returns a dummy id', async () => {
            const result = await caller.user.create({
                email: 'another@example.com',
            });
            (0, vitest_1.expect)(result.id).toBe('dummy-id');
        });
    });
    (0, vitest_1.describe)('getById', () => {
        (0, vitest_1.it)('returns a user by id', async () => {
            const result = await caller.user.getById('user-123');
            (0, vitest_1.expect)(result.id).toBe('user-123');
            (0, vitest_1.expect)(result.email).toBeDefined();
        });
        (0, vitest_1.it)('returns dummy data', async () => {
            const result = await caller.user.getById('any-id');
            (0, vitest_1.expect)(result.email).toBe('test@example.com');
            (0, vitest_1.expect)(result.name).toBe('Test User');
        });
    });
    (0, vitest_1.describe)('list', () => {
        (0, vitest_1.it)('returns a list of users', async () => {
            const result = await caller.user.list();
            (0, vitest_1.expect)(Array.isArray(result)).toBe(true);
            (0, vitest_1.expect)(result.length).toBeGreaterThan(0);
        });
    });
});
