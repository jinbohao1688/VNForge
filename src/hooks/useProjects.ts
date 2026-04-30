import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { VNProject, ApiResult, AIPlan, TargetPlatform } from '../types'

const api = (window as any).api

export function useProjects() {
  const queryClient = useQueryClient()

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<VNProject[]> => {
      const result = await api.invoke('project:list') as ApiResult<VNProject[]>
      if (!result.success) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (config: {
      name: string
      description: string
      directory: string
      genre: string
      targetPlatforms: TargetPlatform[]
    }) => {
      const result = await api.invoke('project:create', config) as ApiResult<VNProject>
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const createWithPlanMutation = useMutation({
    mutationFn: async (config: {
      directory: string
      plan: AIPlan
      initialScript?: string
    }) => {
      const result = await api.invoke('project:createWithPlan', config) as ApiResult<VNProject>
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await api.invoke('project:delete', id) as ApiResult<boolean>
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const openMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await api.invoke('project:open', id) as ApiResult<VNProject | null>
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject: createMutation.mutate,
    createProjectWithPlan: createWithPlanMutation.mutate,
    deleteProject: deleteMutation.mutate,
    openProject: openMutation.mutate,
    isCreating: createMutation.isPending || createWithPlanMutation.isPending,
  }
}

export function useAIPlanning() {
  const generatePlan = useMutation({
    mutationFn: async (ideaText: string): Promise<AIPlan> => {
      const result = await api.invoke('ai:generatePlan', ideaText) as ApiResult<AIPlan>
      if (!result.success) throw new Error(result.error)
      return result.data as AIPlan
    },
  })

  const generateScript = useMutation({
    mutationFn: async (planJson: string) => {
      const result = await api.invoke('ai:generateScript', planJson) as ApiResult<string>
      if (!result.success) throw new Error(result.error)
      return result.data as string
    },
  })

  return { generatePlan, generateScript }
}
