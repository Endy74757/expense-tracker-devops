import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';

const API_URL = 'http://localhost:80'; // URL ของ Category Service

const CategoryManagement = () => {
    const { user, token } = useAuth(); // Get user from AuthContext
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const fetchCategories = useCallback(async () => {
        if (!user?.id) {
            setCategories([]);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            }
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            setError(`เกิดข้อผิดพลาด: ${err.message}`);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, token]); // Dependency on user and token

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleFormSubmit = async (categoryData, categoryId) => {
        const isEditing = !!categoryId;
        const url = isEditing ? `${API_URL}/categories/${categoryId}` : `${API_URL}/categories`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(categoryData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `ไม่สามารถ${isEditing ? 'อัปเดต' : 'สร้าง'}หมวดหมู่ได้`);
            }

            await fetchCategories(); // Refresh list
            setEditingCategory(null);
            setShowForm(false);

        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?')) {
            try {
                const response = await fetch(`${API_URL}/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                }
                await fetchCategories(); // Refresh list
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setShowForm(true);
    };

    const handleCancel = () => {
        setEditingCategory(null);
        setShowForm(false);
    }

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <div>
            <h1>จัดการหมวดหมู่</h1>
            {error && <p className="error-message">เกิดข้อผิดพลาด: {error}</p>}
            
            {user ? (
                <>
                    {!showForm && <button onClick={handleAddNew} style={{ margin: '20px 0' }}>เพิ่มหมวดหมู่ใหม่</button>}
                    {showForm && (
                        <CategoryForm
                            onSubmit={handleFormSubmit}
                            onCancel={handleCancel}
                            initialData={editingCategory}
                            userId={user.id} // Pass user.id to the form
                        />
                    )}
                    {isLoading && <p>กำลังโหลดหมวดหมู่...</p>}
                    <div className="categories-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <CategoryList title="หมวดหมู่รายรับ" categories={incomeCategories} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <CategoryList title="หมวดหมู่รายจ่าย" categories={expenseCategories} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} />
                        </div>
                    </div>
                </>
            ) : (
                <p>กำลังโหลดข้อมูลผู้ใช้...</p>
            )}
        </div>
    );
};

export default CategoryManagement;