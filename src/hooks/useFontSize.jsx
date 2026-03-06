import { createContext, useContext, useEffect, useState } from 'react'

const FontSizeContext = createContext()

const MIN = 12
const MAX = 22
const DEFAULT = 16

export function FontSizeProvider({ children }) {
  const [size, setSize] = useState(() => {
    const saved = parseInt(localStorage.getItem('cie_fontsize'))
    return isNaN(saved) ? DEFAULT : saved
  })

  useEffect(() => {
    localStorage.setItem('cie_fontsize', size)
    document.documentElement.style.fontSize = size + 'px'
  }, [size])

  return (
    <FontSizeContext.Provider value={{ size, setSize, min: MIN, max: MAX }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  return useContext(FontSizeContext)
}