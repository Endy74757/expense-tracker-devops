import React, { useState, useEffect } from 'react';

const TransactionForm = ({ onSubmit, onCancel, initialData, categories = [] }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense'); // 'income' or 'expense'
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [note, setNote] = useState('');
    const [categoryId, setCategoryId] = useState('');

    const isEditing = !!initialData;

    useEffect(() => {
        if (isEditing && initialData) {
            setAmount(initialData.amount);
            setType(initialData.type);
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setNote(initialData.note || '');
            setCategoryId(initialData.category_id || ''); // This should be the ID string, which it is now.
        } else {
            // Reset form for new transaction
            setAmount('');
            setType('expense');
            setDate(new Date().toISOString().split('T')[0]);
            setNote('');
            setCategoryId('');
        }
    }, [initialData, isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setCategoryId('');
        }
    }, [initialData, isEditing]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !date || !type) {
            alert('Please fill all required fields.');
            return;
        }

        const transactionData = {
            amount: parseFloat(amount),
            type,
            date: new Date(date).toISOString(),
            note,
            category_id: categoryId || null, // Send null if no category is selected
        };

        onSubmit(transactionData);
    };

    return (
        <div className="card">
            <h2>{isEditing ? 'แก้ไขธุรกรรม' : 'เพิ่มธุรกรรมใหม่'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>ประเภท</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="expense">รายจ่าย</option>
                        <option value="income">รายรับ</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>หมวดหมู่ (ถ้ามี)</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">-- ไม่ระบุหมวดหมู่ --</option>
                        {/* Filter categories based on the selected transaction type */}
                        {categories.filter(c => c.type === type).map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option> 
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>จำนวนเงิน</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>วันที่</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>บันทึก (ถ้ามี)</label>
                    <input
                        type="text"
                        placeholder="เช่น ค่ากาแฟ"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" style={{ flex: 1 }}>
                        {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มธุรกรรม'}
                    </button>
                    <button type="button" onClick={onCancel} style={{ flex: 1, backgroundColor: '#6c757d' }}>
                        ยกเลิก
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TransactionForm;