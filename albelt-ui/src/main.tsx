import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// PrimeReact styles
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.css'
import 'primeicons/primeicons.css'

const primeReactConfig = {
  autoZIndex: false,
  zIndex: {
    modal: 1100,
    overlay: 1200,
    menu: 1200,
    tooltip: 1300,
    toast: 1400,
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
)
