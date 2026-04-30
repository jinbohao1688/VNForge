import { create } from 'zustand'
import type { VNProject } from '@/types'

interface ProjectStore {
  projects: VNProject[]
  currentProject: VNProject | null
  loading: boolean
  setProjects: (list: VNProject[]) => void
  setCurrentProject: (p: VNProject | null) => void
  addProject: (p: VNProject) => void
  removeProject: (id: string) => void
  updateProject: (id: string, updates: Partial<VNProject>) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  setLoading: (loading) => set({ loading }),
}))