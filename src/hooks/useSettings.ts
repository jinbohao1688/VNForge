import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AppSettings, ApiResult } from '../types'

const api = (window as any).api

export function useSettings() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<AppSettings> => {
      const result = await api.invoke('settings:getAll') as ApiResult<AppSettings>
      if (!result.success) throw new Error(result.error)
      return result.data as AppSettings
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (entries: Partial<AppSettings>) => {
      const result = await api.invoke('settings:setMany', entries) as ApiResult<void>
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })

  return {
    settings: settingsQuery.data as AppSettings | undefined,
    isLoading: settingsQuery.isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}
