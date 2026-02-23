import { createContext, useContext } from 'react'

interface AIModalContextValue {
  openAI: (prefill?: string) => void
}

export const AIModalContext = createContext<AIModalContextValue>({
  openAI: () => {},
})

export const useAIModal = () => useContext(AIModalContext)
