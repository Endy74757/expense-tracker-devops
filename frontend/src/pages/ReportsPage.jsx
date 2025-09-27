import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_GATEWAY_URL = 'http://localhost:80';

const ReportsPage = () => {
    const { user, token } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [compareYear, setCompareYear] = useState(''); // '' for no comparison

    useEffect(() => {
        if (user) {
            const fetchAllData = async () => {
                setIsLoading(true);
                setError('');
                try {
                    // Fetch all transactions for the user
                    const transResponse = await fetch(`${API_GATEWAY_URL}/transactions`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!transResponse.ok) throw new Error('ไม่สามารถดึงข้อมูลธุรกรรมได้');
                    const transData = await transResponse.json();
                    setTransactions(transData);

                    // Fetch all categories
                    const catResponse = await fetch(`${API_GATEWAY_URL}/categories`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (!catResponse.ok) throw new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
                    const catData = await catResponse.json();
                    setCategories(catData.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {}));

                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAllData();
        }
    }, [user, token]);

    // --- Data Processing with useMemo for performance ---

    const processTransactions = (year) => {
        if (!year) return { monthlySummary: [], categorySummary: {} };

        const filtered = transactions.filter(tx => new Date(tx.date).getFullYear() === year);

        const summary = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
        const catSummary = {};

        filtered.forEach(tx => {
            // Monthly summary
            const month = new Date(tx.date).getMonth();
            if (tx.type === 'income') {
                summary[month].income += tx.amount;
            } else {
                summary[month].expense += tx.amount;
            }

            // Category summary
            const catId = tx.category_id || 'uncategorized';
            if (!catSummary[catId]) {
                catSummary[catId] = { name: categories[catId] || 'ไม่ระบุหมวดหมู่', income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                catSummary[catId].income += tx.amount;
            } else {
                catSummary[catId].expense += tx.amount;
            }
        });

        return { monthlySummary: summary, categorySummary: catSummary };
    };

    const primaryData = useMemo(() => processTransactions(selectedYear), [transactions, selectedYear, categories]);
    const compareData = useMemo(() => processTransactions(compareYear ? parseInt(compareYear) : null), [transactions, compareYear, categories]);

    const combinedCategorySummary = useMemo(() => {
        const allCategoryIds = new Set([...Object.keys(primaryData.categorySummary), ...Object.keys(compareData.categorySummary)]);
        const combined = [];

        allCategoryIds.forEach(catId => {
            const primaryCat = primaryData.categorySummary[catId];
            const compareCat = compareData.categorySummary[catId];
            combined.push({
                id: catId,
                name: (primaryCat?.name || compareCat?.name),
                primaryIncome: primaryCat?.income || 0,
                primaryExpense: primaryCat?.expense || 0,
                compareIncome: compareCat?.income || 0,
                compareExpense: compareCat?.expense || 0,
            });
        });
        return combined;
    }, [primaryData.categorySummary, compareData.categorySummary]);

    const chartData = {
        labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
        datasets: [
            {
                label: `รายรับ ปี ${selectedYear}`,
                data: primaryData.monthlySummary.map(s => s.income),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: `รายจ่าย ปี ${selectedYear}`,
                data: primaryData.monthlySummary.map(s => s.expense),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
            // Add comparison year data if selected
            ...(compareYear ? [
                {
                    label: `รายรับ ปี ${compareYear}`,
                    data: compareData.monthlySummary.map(s => s.income),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
                {
                    label: `รายจ่าย ปี ${compareYear}`,
                    data: compareData.monthlySummary.map(s => s.expense),
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                }
            ] : [])
        ]
    };

    const doughnutChartData = useMemo(() => {
        const expenseCategories = Object.values(primaryData.categorySummary)
            .filter(cat => cat.expense > 0)
            .sort((a, b) => b.expense - a.expense);

        const labels = expenseCategories.map(cat => cat.name);
        const data = expenseCategories.map(cat => cat.expense);

        return {
            labels,
            datasets: [{
                label: 'รายจ่าย',
                data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#FFCD56', '#C9CBCF', '#3C8DBC', '#F56954', '#00A65A', '#00C0EF'
                ],
                hoverBackgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#FFCD56', '#C9CBCF', '#3C8DBC', '#F56954', '#00A65A', '#00C0EF'
                ]
            }]
        };
    }, [primaryData.categorySummary]);

    const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);

    if (isLoading) return <div className="loading">กำลังโหลดรายงาน...</div>;
    if (error) return <div className="error">{error}</div>;

    const availableYears = [...new Set(transactions.map(tx => new Date(tx.date).getFullYear()))].sort((a, b) => b - a);

    return (
        <div className="container">
            <h1>รายงานและสถิติ</h1>

            <div className="filters-container">
                <div>
                    <label htmlFor="year-filter">เลือกปีหลัก:</label>
                    <select id="year-filter" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="compare-year-filter">เปรียบเทียบกับปี:</label>
                    <select id="compare-year-filter" value={compareYear} onChange={e => setCompareYear(e.target.value)}>
                        <option value="">-- ไม่เปรียบเทียบ --</option>
                        {availableYears.filter(y => y !== selectedYear).map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                <div className="card">
                    <h2>สรุปรายเดือน {compareYear ? `(เปรียบเทียบปี ${selectedYear} และ ${compareYear})` : `(ปี ${selectedYear})`}</h2>
                    <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                </div>

                <div className="card">
                    <h2>สัดส่วนรายจ่าย ปี {selectedYear}</h2>
                    {doughnutChartData.labels.length > 0 ? (
                        <Doughnut data={doughnutChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                    ) : (
                        <p className="no-data-message">ไม่พบข้อมูลรายจ่ายสำหรับแสดงผล</p>
                    )}
                </div>
            </div>

            <div className="card">
                <h2>สรุปตามหมวดหมู่ {compareYear ? `(เปรียบเทียบปี ${selectedYear} และ ${compareYear})` : `(ปี ${selectedYear})`}</h2>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                                <th>หมวดหมู่</th>
                                <th style={{ textAlign: 'right' }}>รายรับ ({selectedYear})</th>
                                <th style={{ textAlign: 'right' }}>รายจ่าย ({selectedYear})</th>
                                {compareYear && <th style={{ textAlign: 'right' }}>รายรับ ({compareYear})</th>}
                                {compareYear && <th style={{ textAlign: 'right' }}>รายจ่าย ({compareYear})</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {combinedCategorySummary.map((cat) => (
                                <tr key={cat.id}>
                                    <td>{cat.name}</td>
                                    <td style={{ textAlign: 'right', color: 'green' }}>{formatCurrency(cat.primaryIncome)}</td>
                                    <td style={{ textAlign: 'right', color: 'red' }}>{formatCurrency(cat.primaryExpense)}</td>
                                    {compareYear && (
                                        <>
                                            <td style={{ textAlign: 'right', color: 'green' }}>{formatCurrency(cat.compareIncome)}</td>
                                            <td style={{ textAlign: 'right', color: 'red' }}>{formatCurrency(cat.compareExpense)}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;