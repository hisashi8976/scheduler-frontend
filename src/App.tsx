import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AdminPage from './pages/AdminPage'
import EditPage from './pages/EditPage'
import HomePage from './pages/HomePage'
import RespondPage from './pages/RespondPage'
import ResultsPage from './pages/ResultsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/e/:publicId" element={<RespondPage />} />
      <Route path="/e/:publicId/results" element={<ResultsPage />} />
      <Route path="/e/:publicId/admin" element={<AdminPage />} />
      <Route path="/e/:publicId/edit/:editKey" element={<EditPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
