import { useQuery } from '@tanstack/react-query'
import type { EnvStatus, ApiResult } from '../types'

const api = (window as any).api

export function useEnvCheck() {
  return useQuery({
    queryKey: ['envCheck'],
    queryFn: async (): Promise<EnvStatus> => {
      const result = await api.invoke('env:check') as ApiResult<EnvStatus>
      if (!result.success) throw new Error(result.error)
      return result.data as EnvStatus
    },
    refetchInterval: false,
  })
}
