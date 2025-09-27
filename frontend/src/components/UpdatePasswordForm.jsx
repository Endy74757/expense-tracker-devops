import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:80'; // User service URL

const UpdatePasswordForm = () => {
    const { token } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (newPassword.length < 8) {
            setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'ไม่สามารถอัปเดตรหัสผ่านได้');
            }

            setSuccess('อัปเดตรหัสผ่านสำเร็จ!');
            setOldPassword('');
            setNewPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>เปลี่ยนรหัสผ่าน</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="old_password">รหัสผ่านเดิม</label>
                    <input
                        id="old_password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="new_password">รหัสผ่านใหม่</label>
                    <input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit" disabled={isLoading}>{isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</button>
            </form>
        </div>
    );
};

export default UpdatePasswordForm;