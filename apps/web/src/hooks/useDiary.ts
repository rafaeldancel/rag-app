import { trpc } from '../lib/trpc'
import { useAuth } from '../providers/AuthProvider'

function useUserId() {
  const { user } = useAuth()
  return user?.uid ?? ''
}

export function useDiaryEntries() {
  const userId = useUserId()
  return trpc.diary.list.useQuery({ userId }, { enabled: !!userId })
}

export function useCreateDiaryEntry() {
  const userId = useUserId()
  const utils = trpc.useUtils()
  return trpc.diary.create.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId }),
  })
}

export function useUpdateDiaryEntry() {
  const userId = useUserId()
  const utils = trpc.useUtils()
  return trpc.diary.update.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId }),
  })
}

export function useDeleteDiaryEntry() {
  const userId = useUserId()
  const utils = trpc.useUtils()
  return trpc.diary.delete.useMutation({
    onSuccess: () => utils.diary.list.invalidate({ userId }),
  })
}
