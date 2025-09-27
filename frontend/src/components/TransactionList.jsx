// src/components/TransactionList.jsx
import React from 'react';
import './TransactionList.css';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Using react-icons for better visuals

const TransactionList = ({ transactions, categoriesMap, onEdit, onDelete }) => {
    if (!transactions) return null;

    return (
        <div className="card">
            <h2>ประวัติธุรกรรม</h2>
            {transactions.length === 0 ? (
                <p className="no-data-message">ไม่พบข้อมูลธุรกรรม</p>
            ) : (
                <ul className="transaction-list">
                    {transactions.map((tx) => ( // ใช้ tx.id ซึ่งคือ _id จาก MongoDB
                        <li key={tx.id} className="transaction-item">
                            <div className={`type-icon ${tx.type}`}>
                                {tx.type === 'income' ? <FaArrowDown /> : <FaArrowUp />}
                            </div>
                            <div className="transaction-details">
                                <span className="note">{tx.note || 'ไม่มีบันทึก'}</span>
                                <div className="meta-info">
                                    <span className="category-badge">{categoriesMap[tx.category_id] || 'ไม่ระบุ'}</span>
                                    <span className="date">{new Date(tx.date).toLocaleDateString('th-TH')}</span>
                                </div>
                            </div>
                            <div className={`transaction-amount ${tx.type}`}>
                                {tx.type === 'expense' ? '-' : '+'} {tx.amount.toFixed(2)} บาท
                            </div>
                            <div className="transaction-actions">
                                <button onClick={() => onEdit(tx)} className="edit-btn">✏️</button>
                                <button onClick={() => onDelete(tx.id)} className="delete-btn">❌</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TransactionList;
