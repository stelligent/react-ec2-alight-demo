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
} from '@mui/material';
import axios from 'axios';

import { config } from './config';

function UsersList() {
    const [users, setUsers] = useState([]);
    const [userData, setUserData] = useState({ username: '', email: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    const handleSubmit = () => {
        handleAddUser(userData);
        setUserData({ username: '', email: '' }); // Clear the form
    };

    useEffect(() => {
        // Replace with your API call to fetch users
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const handleAddUser = async (newUserData) => {
        try {
            await axios.post(`${config.baseUrl}/users`, newUserData);
            console.log('User added');
            fetchUsers(); // Refresh the list after adding a new user
        } catch (error) {
            console.error('Error adding user:', error);
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
