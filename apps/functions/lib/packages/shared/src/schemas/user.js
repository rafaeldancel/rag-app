import { z } from 'zod';
export const UserSchema = z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().optional(),
});
export const CreateUserSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
});
