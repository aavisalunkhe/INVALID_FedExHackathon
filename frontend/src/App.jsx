import React, { useState } from 'react';
import HomePage from './pages/homepage/HomePage.jsx';
import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import OptimRoute from './pages/optimRoute/optimRoute.jsx';

function App() {
  return (
    <Box>
      <Routes> 
        <Route path= "/" element= {<HomePage/>} />
        <Route path= "/optimRoute" element= {<OptimRoute/>} />
      </Routes>
    </Box>
  );
}

export default App;