import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// The zero-JS boot shell served its purpose; let it go once React is live.
requestAnimationFrame(() => document.getElementById('boot')?.remove())
