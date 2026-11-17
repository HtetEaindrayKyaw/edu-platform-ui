import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './PlatformApp.jsx'
// Keep AI utilities in the application entry as well as standalone components.
import './components/ai/ai-suite.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
