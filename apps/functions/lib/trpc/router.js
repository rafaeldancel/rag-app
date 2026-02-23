import { router } from './trpc';
import { userRouter } from './routers/user';
import { bibleRouter } from './routers/bible';
import { diaryRouter } from './routers/diary';
import { annotationsRouter } from './routers/annotations';
export const appRouter = router({
    user: userRouter,
    bible: bibleRouter,
    diary: diaryRouter,
    annotations: annotationsRouter,
});
