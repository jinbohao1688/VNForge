import { create } from 'zustand'
import type { EnvStatus } from '@/types'

interface EnvStore {
  status: EnvStatus | null
  isChecking: boolean
  setStatus: (status: EnvStatus | null) => void
  setChecking: (v: boolean) => void
}

export const useEnvStore = create<EnvStore>((set) => ({
  status: null,
  isChecking: false,
  setStatus: (status) => set({ status }),
  setChecking: (isChecking) => set({ isChecking }),
}))