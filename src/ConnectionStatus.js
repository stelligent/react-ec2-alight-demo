import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgress, Box, Typography } from '@mui/material';

import { config } from './config';

function ConnectionStatus() {
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

        fetchConnectionDetails();
    }, []);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {loading ? (
                <CircularProgress />
            ) : (
                <>
                    <Typography variant='body1'>
                        Host: {connectionDetails?.host || 'N/A'}
                    </Typography>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            borderRadius: '50%',
                            backgroundColor:
                                connectionDetails?.status === 'connected' ? 'green' : 'red',
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
