import React from 'react';

const Summary = ({ income, expense }) => {
    const balance = income - expense;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

    return (
        <div className="summary-container">
            <div className="summary-card income">
                <h4>รายรับ</h4>
                <p>{formatCurrency(income)}</p>
            </div>
            <div className="summary-card expense">
                <h4>รายจ่าย</h4>
                <p>{formatCurrency(expense)}</p>
            </div>
            <div className="summary-card balance">
                <h4>คงเหลือ</h4>
                <p style={{ color: balance >= 0 ? '#28a745' : '#dc3545' }}>
                    {formatCurrency(balance)}
                </p>
            </div>
        </div>
    );
};

export default Summary;