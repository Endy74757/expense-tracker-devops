import React, { createContext, useState, useContext } from 'react';

// --- การตั้งค่าที่ต้องแก้ไข ---
const API_GATEWAY_URL = 'http://localhost:80'; // URL ของ API Gateway
// --------------------------

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);

    const login = async (email, password) => {
        const response = await fetch(`${API_GATEWAY_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        setToken(data.access_token);
        return data.access_token;
    };

    const register = async (name, email, password) => {
        const response = await fetch(`${API_GATEWAY_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }

        // API returns the created user profile. We don't log them in automatically.
        return await response.json();
    };

    const fetchCurrentUser = async (tokenToUse) => {
        // Decode token to get user_id (sub)
        const payload = JSON.parse(atob(tokenToUse.split('.')[1]));
        const userId = payload.sub;

        const response = await fetch(`${API_GATEWAY_URL}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${tokenToUse}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    const value = { token, user, login, register, logout, fetchCurrentUser };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};