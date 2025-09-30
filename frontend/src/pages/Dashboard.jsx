import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserInfo from '../components/UserInfo';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import Summary from '../components/Summary'; // Import a new component for the summary
import Pagination from '../components/Pagination'; // Import the new Pagination component

// --- การตั้งค่าที่ต้องแก้ไข ---
const API_GATEWAY_URL = 'http://localhost:80'; // URL ของ API Gateway
const ITEMS_PER_PAGE = 10; // จำนวนรายการต่อหน้า

const Dashboard = () => {
    const { user, token, logout, fetchCurrentUser } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [categories, setCategories] = useState({ list: [], map: {} }); // Initialize as an object
    const [editingTransaction, setEditingTransaction] = useState(null); // To hold data for editing
    const [categoryFilter, setCategoryFilter] = useState(''); // State for category filter, '' means all
    const [currentPage, setCurrentPage] = useState(1); // State for pagination

     useEffect(() => {
        // This logic has been moved to App.jsx to handle it globally.

        // If there's a user, fetch their transactions
        if (user) {
            // Pass the token to fetch functions for consistency
            fetchTransactions();
            fetchCategories();
        }
    }, [user, token]); // Re-run when user or token changes

    const fetchTransactions = async (userId) => {
        setIsTransactionsLoading(true);
        setError('');
        try {
            // The user_id is now derived from the token on the backend.
            const response = await fetch(`${API_GATEWAY_URL}/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`ไม่สามารถดึงข้อมูลธุรกรรมได้ (สถานะ: ${response.status})`);
            }

            const data = await response.json();
            // Ensure every transaction has an id field (for MongoDB _id compatibility)
            const mappedData = data.map(tx => ({
                ...tx,
                id: tx.id || tx._id // ใช้ id ถ้ามี ถ้าไม่มีใช้ _id
            }));
            setTransactions(mappedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    const fetchCategories = async () => {
        if (!token) return;
        setIsCategoriesLoading(true);
        try {
            const response = await fetch(`${API_GATEWAY_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                // Not a critical error, so just log it and continue
                console.error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
                return;
            }
            const data = await response.json();
            // Map categories to an object for quick lookups
            const categoryMap = data.reduce((acc, cat) => {
                acc[cat.id] = cat.name;
                return acc;
            }, {});
            setCategories({ list: data, map: categoryMap }); // Ensure both list and map are set
        } catch (err) {
            console.error("Error fetching categories:", err.message);
        } finally {
            setIsCategoriesLoading(false);
        }
    };

    const handleFormSubmit = async (transactionData) => {
        const apiEndpoint = editingTransaction
            ? `${API_GATEWAY_URL}/transactions/${editingTransaction.id}`
            : `${API_GATEWAY_URL}/transactions`;

        const method1 = editingTransaction ? 'PUT' : 'POST';

        // For new transactions, add the user_id
        if (!editingTransaction) {
            transactionData.user_id = user.id;
        }
        else {
            // Remove user_id for update
            delete transactionData.user_id;
        }
        // Ensure amount is number, date is ISO, and type is string
        if (transactionData.amount) transactionData.amount = parseFloat(transactionData.amount);
        if (transactionData.date) transactionData.date = new Date(transactionData.date).toISOString();

        try {
            const response = await fetch(apiEndpoint, {
                method: method1,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(transactionData),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to save transaction');
            }

            // Reset form and refresh list
            setIsFormVisible(false);
            setEditingTransaction(null);
            fetchTransactions(); // Refresh the list

        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (transactionId) => {
        if (!transactionId) {
            setError('ไม่พบรหัสธุรกรรมที่ต้องการลบ');
            return;
        }
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบธุรกรรมนี้?')) return;

        try {
            const response = await fetch(`${API_GATEWAY_URL}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to delete transaction');
            }

            fetchTransactions(); // Refresh the list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setIsFormVisible(true);
    };

    if (!user) {
        return <div className="loading">กำลังโหลดข้อมูลผู้ใช้...</div>;
    }

    const isLoading = isTransactionsLoading || isCategoriesLoading;

    // Filter transactions based on the selected category
    const filteredTransactions = transactions.filter(tx => {
        if (!categoryFilter) {
            return true; // If no filter is selected, show all
        }
        return tx.category_id === categoryFilter;
    });

    // --- Pagination Logic ---
    // Calculate total pages
    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    // Get current transactions for the page
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    // --- End Pagination Logic ---

    // Calculate totals for the summary based on the *filtered* transactions
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <div className="container">
            <h1>ภาพรวมธุรกรรม</h1>

            <Summary income={totalIncome} expense={totalExpense} />

            <div className="filters-container">
                <label htmlFor="category-filter">กรองตามหมวดหมู่:</label>
                <select 
                    id="category-filter"
                    value={categoryFilter} 
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page on filter change
                    }}
                >
                    <option value="">ทุกหมวดหมู่</option>
                    {categories.list?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
            </div>

            {isFormVisible ? (
                <TransactionForm
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setIsFormVisible(false);
                        setEditingTransaction(null);
                    }}
                    initialData={editingTransaction}
                    categories={categories.list || []}
                />
            ) : (
                <button onClick={() => setIsFormVisible(true)} style={{ width: '100%', marginTop: '20px' }}>
                    + เพิ่มธุรกรรมใหม่
                </button>
            )}

            {error && <div className="error" style={{ marginTop: '20px' }}>{error}</div>}
            {isLoading && <div className="loading">กำลังโหลดธุรกรรม...</div>}
            {!isLoading && (
                <>
                    <TransactionList transactions={currentTransactions} categoriesMap={categories.map || {}} onEdit={handleEdit} onDelete={handleDelete} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
            )}
        </div>
    );
};

export default Dashboard;