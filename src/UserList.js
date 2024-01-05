import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Grid,
    TextField,
    Typography,
} from '@mui/material';
import axios from 'axios';

import { config } from './config';

function UsersList({ isConnecting }) {
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({ username: '', email: '' });
    const [error, setError] = useState('');

    // useEffect hook to refetch users when isConnecting changes
    useEffect(() => {
        if (!isConnecting) {
            // Optionally, fetch only when not connecting
            fetchUsers();
        } else {
            setError('');
            setUsers([]);
        }
    }, [isConnecting]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    const handleSubmit = () => {
        handleAddUser(userData);
        setUserData({ username: '', email: '' }); // Clear the form
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${config.baseUrl}/users`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`${config.baseUrl}/users/${userId}`);
            console.log('User deleted');
            fetchUsers(); // Refresh the list after deletion
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleUpdate = async (userId, updatedUserData) => {
        try {
            await axios.put(`${config.baseUrl}/users/${userId}`, updatedUserData);
            console.log('User updated');
            fetchUsers(); // Refresh the list after update
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleAddUser = async () => {
        try {
            await axios.post(`${config.baseUrl}/users`, userData);
            console.log('User added');
            fetchUsers(); // Refresh the list after adding a new user
            setUserData({ username: '', email: '' }); // Clear the form
            setError(''); // Clear any existing error
        } catch (error) {
            setError(`${error.message} ${error.response.data}` || 'Failed to add user');
        }
    };

    return (
        <Grid container spacing={2} sx={{ marginTop: '20px' }}>
            <Grid item xs={6}>
                <Grid item>
                    <TextField
                        fullWidth
                        label='Username'
                        name='username'
                        value={userData.username}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item sx={{ marginTop: '20px' }}>
                    <TextField
                        fullWidth
                        label='Email'
                        name='email'
                        value={userData.email}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item sx={{ marginTop: '20px' }}>
                    <Button variant='contained' color='primary' onClick={handleSubmit}>
                        Add User
                    </Button>
                </Grid>
                <Grid item sx={{ marginTop: '20px' }}>
                    {error && <Typography color='error'>{error}</Typography>}
                </Grid>
            </Grid>
            <Grid item xs={6}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell align='right'>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell align='right'>
                                        <Button onClick={() => handleUpdate(user.id)}>
                                            Update
                                        </Button>
                                        <Button onClick={() => handleDelete(user.id)}>
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
    );
}

export default UsersList;
