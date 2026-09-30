import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './app/globals.css'
import { setupApiInterceptor } from './lib/api-config'

setupApiInterceptor()


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
