import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Box, Typography } from '@mui/material';

import { config } from './config';

function ConnectionStatus({ isConnecting }) {
    const [connectionDetails, setConnectionDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConnectionDetails = async () => {
            try {
                const response = await axios.get(`${config.baseUrl}/connection-details`);
                setConnectionDetails(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching connection details:', error);
                setLoading(false);
            }
        };
        const createTable = async () => {
            try {
                const response = await axios.get(`${config.baseUrl}/create-users-table`);
                console.log(response.data);
                alert('Response: ' + response.data); // Display response in an alert or handle as needed
            } catch (error) {
                console.error('Error:', error);
            }
        };

        fetchConnectionDetails();
        createTable();
    }, [isConnecting]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: '20px' }}>
            {loading ? (
                <CircularProgress />
            ) : (
                <>
                    <Typography variant='body1'>
                        <b>Host:</b> {connectionDetails?.host || 'N/A'}
                    </Typography>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            borderRadius: '50%',
                            backgroundColor:
                                connectionDetails?.status === 'Connected' ? 'green' : 'red',
                        }}
                    />
                    <Typography variant='body1'>
                        Status: {connectionDetails?.status || 'Unknown'}
                    </Typography>
                </>
            )}
        </Box>
    );
}

export default ConnectionStatus;
