import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:80'; // User service URL

const UpdateNameForm = () => {
    const { user, token, fetchCurrentUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_URL}/users/me/name`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'ไม่สามารถอัปเดตชื่อได้');
            }

            setSuccess('อัปเดตชื่อสำเร็จ!');
            await fetchCurrentUser(token); // Refresh user data in context
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>เปลี่ยนชื่อ</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">ชื่อใหม่</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit" disabled={isLoading}>{isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</button>
            </form>
        </div>
    );
};

export default UpdateNameForm;