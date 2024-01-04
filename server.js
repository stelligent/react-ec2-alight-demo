const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS module
const app = express();
const port = 3001;

// Use CORS middleware (allows requests from all origins)
app.use(cors());

app.get('/api/region', async (req, res) => {
  try {
    const response = await axios.get('http://169.254.169.254/latest/meta-data/placement/region');
    res.send(response.data);
  } catch (error) {
    // Check if the error is due to a network issue or unavailable metadata
    if (error.response === undefined || error.response.status === 404) {
      res.status(200).send('Running locally');
    } else {
      res.status(500).send('Error fetching region');
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});