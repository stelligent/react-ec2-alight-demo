import React, { useState, useEffect } from 'react';
import axios from 'axios';

import logo from './logo.svg';
import './App.css';

function App() {
  const [region, setRegion] = useState('');

  useEffect(() => {
    async function fetchRegion() {
      try {
        const response = await axios.get('/api/region');
        setRegion(response.data);
      } catch (error) {
        console.error('Error fetching region', error);
      }
    }

    fetchRegion();
  }, []);

  return (
    <div className="App">
      <h1>EC2 Instance Region: {region}</h1>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;