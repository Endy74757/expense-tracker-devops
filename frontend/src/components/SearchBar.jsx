// src/components/SearchBar.jsx
import React, { useState } from 'react';
import './SearchBar.css'; // สร้างไฟล์ CSS แยกสำหรับ Component นี้

const SearchBar = ({ onSearch, isLoading }) => {
    const [userId, setUserId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // ป้องกันการ refresh หน้าเมื่อกด Enter
        if (userId) {
            onSearch(userId);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="search-box">
            <label htmlFor="userIdInput">กรุณาใส่ User ID:</label>
            <input
                id="userIdInput"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="เช่น 1, 2, 3..."
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'กำลังโหลด...' : 'ดึงข้อมูล'}
            </button>
        </form>
    );
};

export default SearchBar;
