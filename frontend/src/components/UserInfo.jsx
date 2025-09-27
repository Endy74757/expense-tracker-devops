// src/components/UserInfo.jsx
import React from 'react';

const UserInfo = ({ user }) => {
    if (!user) return null;

    return (
        <div className="card">
            <h2>ข้อมูลผู้ใช้</h2>
            <p><strong>ID:</strong> {user.id || 'N/A'}</p>
            <p><strong>ชื่อ:</strong> {user.name || 'N/A'}</p>
            <p><strong>อีเมล:</strong> {user.email || 'N/A'}</p>
        </div>
    );
};

export default UserInfo;
