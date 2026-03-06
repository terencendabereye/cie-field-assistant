import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StatusBar } from './components/StatusBar'
import { BottomNav } from './components/BottomNav'
import { ToolsPage } from './modules/tools/ToolsPage'
import { InterpolationTool } from './modules/tools/InterpolationTool'
import { UnitConverter } from './modules/tools/UnitConverter'
import { NotesPage } from './modules/notes/NotesPage'
import { SchedulePage } from './modules/schedule/SchedulePage'
import { FormulasPage } from './modules/FormulasPage'
import { SettingsPage } from './modules/settings/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      {/*
        This div is the entire app shell.
        width: 100vw + overflow hidden = nothing can ever make it wider than the screen.
        height: 100% fills the fixed #root exactly.
        No content inside any tab can affect these dimensions.
      */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        maxWidth: '480px',
        height: '100%',
        margin: '0 auto',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <StatusBar />

        <main style={{
          flex: 1,
          minHeight: 0,    /* prevents content from expanding this beyond its flex allocation */
          minWidth: 0,     /* prevents content from expanding this horizontally */
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Routes>
            <Route path="/" element={<Navigate to="/tools/interpolation" replace />} />
            <Route path="/tools" element={<ToolsPage />}>
              <Route path="interpolation" element={<InterpolationTool />} />
              <Route path="units"         element={<UnitConverter />} />
            </Route>
            <Route path="/notes"    element={<NotesPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/formulas" element={<FormulasPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </HashRouter>
  )
}