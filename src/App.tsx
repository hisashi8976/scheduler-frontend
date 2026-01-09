import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AdminResponsesPage from './pages/AdminResponsesPage'
import EditPage from './pages/EditPage'
import HomePage from './pages/HomePage'
import RespondPage from './pages/RespondPage'
import ResultsPage from './pages/ResultsPage'

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Schedule Sync</p>
          <p className="app-title">スマートなスケジュール調整</p>
        </div>
        <div className="app-status">
          <span className="status-dot" aria-hidden="true" />
          <span>Planning in motion</span>
        </div>
      </header>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/e/:publicId" element={<RespondPage />} />
          <Route path="/e/:publicId/results" element={<ResultsPage />} />
          <Route path="/e/:publicId/admin" element={<AdminResponsesPage />} />
          <Route path="/e/:publicId/edit/:editKey" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
