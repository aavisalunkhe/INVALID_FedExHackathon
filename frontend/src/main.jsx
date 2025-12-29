import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Navbar from './components/navbar/Navbar.jsx'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import "leaflet/dist/leaflet.css";

const theme = createTheme({
  typography: {
    fontFamily: "'Source Code Pro', 'serif'",
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
