import { create } from 'zustand'

interface CanvasState {
  deviceFilter: string
  pageFilter: string
  selectedFrameId: string | null
  setDeviceFilter: (filter: string) => void
  setPageFilter: (filter: string) => void
  setSelectedFrameId: (id: string | null) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  deviceFilter: 'all',
  pageFilter: 'all',
  selectedFrameId: null,
  setDeviceFilter: (filter) => set({ deviceFilter: filter }),
  setPageFilter: (filter) => set({ pageFilter: filter }),
  setSelectedFrameId: (id) => set({ selectedFrameId: id }),
}))
