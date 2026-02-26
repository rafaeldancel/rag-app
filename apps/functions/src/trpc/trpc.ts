import { initTRPC, TRPCError } from '@trpc/server'

export interface TRPCContext {
  uid: string | null
}

const t = initTRPC.context<TRPCContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

/** Requires a verified Firebase ID token — throws UNAUTHORIZED otherwise. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.uid) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required.' })
  }
  return next({ ctx: { uid: ctx.uid } })
})
