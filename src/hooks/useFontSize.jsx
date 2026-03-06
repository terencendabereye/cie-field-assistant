import { createContext, useContext, useEffect, useState } from 'react'

const FontSizeContext = createContext()

const SIZES = {
  small:  { label: 'Small',  scale: '14px' },
  medium: { label: 'Medium', scale: '16px' },
  large:  { label: 'Large',  scale: '18px' },
}

export function FontSizeProvider({ children }) {
  const [size, setSize] = useState(() => localStorage.getItem('cie_fontsize') || 'medium')

  useEffect(() => {
    localStorage.setItem('cie_fontsize', size)
    // Apply font size to root so all rem/em units scale with it
    document.documentElement.style.fontSize = SIZES[size].scale
  }, [size])

  return (
    <FontSizeContext.Provider value={{ size, setSize, sizes: SIZES }}>
      {children}
    </FontSizeContext.Provider>
  )
}

export function useFontSize() {
  return useContext(FontSizeContext)
}
