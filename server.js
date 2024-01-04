const express = require('express');
const axios = require('axios');
const app = express();

app.get('/api/region', async (req, res) => {
  try {
    const response = await axios.get('http://169.254.169.254/latest/meta-data/placement/region');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching region');
  }
});