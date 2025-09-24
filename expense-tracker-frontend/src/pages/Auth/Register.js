import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Implement registration logic here
    console.log('Registration submitted', { name, email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" variant="contained">Register</Button>
    </form>
  );
}

export default Register;
