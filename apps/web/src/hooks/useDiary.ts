import { trpc } from '../lib/trpc'

const USER_ID = 'guest'

export function useDiaryEntries() {
  return trpc.diary.list.useQuery({ userId: USER_ID })
}

export function useCreateDiaryEntry() {
  const utils = trpc.useUtils()
  return trpc.diary.create.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId: USER_ID }),
  })
}

export function useUpdateDiaryEntry() {
  const utils = trpc.useUtils()
  return trpc.diary.update.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId: USER_ID }),
  })
}

export function useDeleteDiaryEntry() {
  const utils = trpc.useUtils()
  return trpc.diary.delete.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId: USER_ID }),
  })
}
