import React from 'react';

const CategoryList = ({ title, categories, onEdit, onDelete, isLoading }) => {
    if (isLoading) {
        return <div className="card"><h3>{title}</h3><p>กำลังโหลด...</p></div>;
    }

    return (
        <div className="card">
            <h3>{title}</h3>
            {categories.length === 0 ? (
                <p>ไม่พบหมวดหมู่</p>
            ) : (
                <ul className="transaction-list">
                    {categories.map((cat) => (
                        <li key={cat._id} className={`transaction-item ${cat.type}`}>
                            <span>{cat.name}</span>
                            <div className="transaction-actions">
                                <button onClick={() => onEdit(cat)} className="edit-btn">✏️</button>
                                <button onClick={() => onDelete(cat._id)} className="delete-btn">❌</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CategoryList;