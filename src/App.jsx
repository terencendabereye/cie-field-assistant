import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StatusBar } from './components/StatusBar'
import { BottomNav } from './components/BottomNav'
import { ToolsPage } from './modules/tools/ToolsPage'
import { InterpolationTool } from './modules/tools/InterpolationTool'
import { UnitConverter } from './modules/tools/UnitConverter'
import { NotesPage } from './modules/notes/NotesPage'
import { SchedulePage } from './modules/schedule/SchedulePage'
import { FormulasPage } from './modules/FormulasPage'
import { CalibrationPage } from './modules/calibration/CalibrationPage'

export default function App() {
  return (
    <HashRouter>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <StatusBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/tools/interpolation" replace />} />
            <Route path="/tools" element={<ToolsPage />}>
              <Route path="interpolation" element={<InterpolationTool />} />
              <Route path="units"         element={<UnitConverter />} />
            </Route>
            <Route path="/notes"       element={<NotesPage />} />
            <Route path="/schedule"    element={<SchedulePage />} />
            <Route path="/formulas"    element={<FormulasPage />} />
            <Route path="/calibration" element={<CalibrationPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  )
}