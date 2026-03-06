import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    // Default to dark mode; respect saved preference if it exists
    const saved = localStorage.getItem('cie_theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('cie_theme', dark ? 'dark' : 'light')
    // Apply theme class to root so CSS variables can switch
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
