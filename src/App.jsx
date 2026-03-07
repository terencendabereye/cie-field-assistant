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
      <div className="flex flex-col h-full" style={{ maxWidth: '480px', margin: '0 auto' }}>
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