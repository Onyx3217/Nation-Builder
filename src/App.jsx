import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Creation from './pages/Creation'
import World from './pages/World'
import WorldModeSelector from './pages/WorldModeSelector'
import AudioPlayer from './components/AudioPlayer'

export default function App() {
  return (
    <BrowserRouter>
      {/* Global ambient audio — renders nothing, controls music reactively */}
      <AudioPlayer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mode-select" element={<WorldModeSelector />} />
        <Route path="/create" element={<Creation />} />
        <Route path="/world" element={<World />} />
      </Routes>
    </BrowserRouter>
  )
}
