"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const user_1 = require("./routers/user");
exports.appRouter = (0, trpc_1.router)({
    user: user_1.userRouter,
});
