import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import Dashboard from './routes/Dashboard'
import { EditorPage } from './pages/EditorPage'
import { SettingsPage } from './pages/SettingsPage'

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
