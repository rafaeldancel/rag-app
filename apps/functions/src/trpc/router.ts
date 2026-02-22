import { router } from './trpc'
import { userRouter } from './routers/user'
import { bibleRouter } from './routers/bible'

export const appRouter = router({
  user: userRouter,
  bible: bibleRouter,
})

export type AppRouter = typeof appRouter
