"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const shared_1 = require("@repo/shared");
exports.userRouter = (0, trpc_1.router)({
    create: trpc_1.publicProcedure
        .input(shared_1.CreateUserSchema)
        .output(shared_1.UserSchema)
        .mutation(({ input }) => ({
        id: 'dummy-id',
        email: input.email,
        name: input.name,
    })),
    getById: trpc_1.publicProcedure
        .input(zod_1.z.string())
        .output(shared_1.UserSchema)
        .query(({ input }) => ({
        id: input,
        email: 'test@example.com',
        name: 'Test User',
    })),
    list: trpc_1.publicProcedure.output(zod_1.z.array(shared_1.UserSchema)).query(() => [
        { id: 'user-1', email: 'user1@example.com', name: 'User One' },
        { id: 'user-2', email: 'user2@example.com', name: 'User Two' },
    ]),
});
