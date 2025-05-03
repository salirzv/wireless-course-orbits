import { createRoot } from 'react-dom/client'
import './index.css'
import OrbitVisualizer from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <OrbitVisualizer />,
)
