import React, { useState, useEffect } from 'react';

const CategoryForm = ({ onSubmit, onCancel, initialData, userId }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');

    const isEditing = !!initialData;

    useEffect(() => {
        if (isEditing && initialData) {
            setName(initialData.name);
            setType(initialData.type);
        } else {
            // Reset form for new category
            setName('');
            setType('expense');
        }
    }, [initialData, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !type || !userId) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const categoryData = {
            name,
            type,
            user_id: userId,
        };

        onSubmit(categoryData, initialData?._id);
    };

    return (
        <div className="card">
            <h2>{isEditing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>ชื่อหมวดหมู่</label>
                    <input
                        type="text"
                        placeholder="เช่น เงินเดือน, ค่าอาหาร"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>ประเภท</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="expense">รายจ่าย</option>
                        <option value="income">รายรับ</option>
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" style={{ flex: 1 }}>
                        {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                    </button>
                    {onCancel && (
                         <button type="button" onClick={onCancel} style={{ flex: 1, backgroundColor: '#6c757d' }}>
                            ยกเลิก
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;