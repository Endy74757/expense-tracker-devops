import React from 'react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) {
        return null; // ไม่ต้องแสดงถ้ามีแค่หน้าเดียว
    }

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="pagination-container">
            <button onClick={handlePrevious} disabled={currentPage === 1}>
                &laquo; ก่อนหน้า
            </button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={currentPage === number ? 'active' : ''}>
                    {number}
                </button>
            ))}
            <button onClick={handleNext} disabled={currentPage === totalPages}>
                ต่อไป &raquo;
            </button>
        </div>
    );
};

export default Pagination;