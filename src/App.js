import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Grid, Container, Divider } from '@mui/material';
import axios from 'axios';

import './App.css';
import { config } from './config';

import UserList from './UserList';
import ConnectionStatus from './ConnectionStatus';

function App() {
    const [region, setRegion] = useState('');
    const [rdsInstances, setRdsInstances] = useState([]);
    const [selectedInstance, setSelectedInstance] = useState('');

    useEffect(() => {
        async function fetchRegion() {
            try {
                const response = await axios.get(`${config.baseUrl}/api/region`);
                setRegion(response.data);
            } catch (error) {
                console.error('Error fetching region', error);
            }
        }

        fetchRegion();
    });

    useEffect(() => {
        const fetchRDSInstances = async () => {
            try {
                const response = await axios.get(
                    `${config.baseUrl}/list-rds-instances?region=${region}`,
                );
                setRdsInstances(response.data);
            } catch (error) {
                console.error('Error fetching RDS instances:', error);
                // Handle error appropriately
            }
        };

        fetchRDSInstances();
    }, [region]); // This effect runs whenever 'region' changes

    const handleInstanceChange = async (event) => {
        const newHost = event.target.value;
        setSelectedInstance(newHost);

        try {
            await axios.post(`${config.baseUrl}/change-host`, { host: newHost });
            console.log('Host changed to:', newHost);
        } catch (error) {
            console.error('Error changing host:', error);
        }
    };

    return (
        <Container>
            <Grid container spacing={2} sx={{ marginTop: '20px' }}>
                <Grid item xs={6}>
                    <h3>EC2 Instance Region: {region}</h3>
                </Grid>
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel id='rds-instance-select-label'>RDS Instance</InputLabel>
                        <Select
                            labelId='rds-instance-select-label'
                            value={selectedInstance}
                            label='RDS Instance'
                            onChange={handleInstanceChange}
                        >
                            {rdsInstances.map((instance) => (
                                <MenuItem
                                    key={instance.DBInstanceIdentifier}
                                    value={instance.Endpoint.Address}
                                >
                                    {instance.DBInstanceIdentifier}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <ConnectionStatus />
            <Divider sx={{ marginTop: '20px' }} />
            <UserList />
        </Container>
    );
}

export default App;
