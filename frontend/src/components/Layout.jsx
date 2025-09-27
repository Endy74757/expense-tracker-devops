import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';
import { FaBars, FaTimes } from 'react-icons/fa';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-content">
                    <div className="logo">
                        <NavLink to="/dashboard">MyFin</NavLink>
                    </div>
                    <nav className="app-nav desktop-nav">
                        <NavLink to="/dashboard">ภาพรวม</NavLink>
                        <NavLink to="/categories">หมวดหมู่</NavLink>
                        <NavLink to="/reports">รายงาน</NavLink>
                        <NavLink to="/settings">ตั้งค่า</NavLink>
                    </nav>
                    <div className="user-actions">
                        <span className="user-name">สวัสดี, {user?.name}</span>
                        <button onClick={handleLogout} className="button-logout">ออกจากระบบ</button>
                    </div>
                    <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <nav className="app-nav mobile-nav">
                        <NavLink to="/dashboard" onClick={toggleMobileMenu}>ภาพรวม</NavLink>
                        <NavLink to="/categories" onClick={toggleMobileMenu}>หมวดหมู่</NavLink>
                        <NavLink to="/reports" onClick={toggleMobileMenu}>รายงาน</NavLink>
                        <NavLink to="/settings" onClick={toggleMobileMenu}>ตั้งค่า</NavLink>
                    </nav>
                )}
            </header>
            <main className="app-content">{<Outlet />}</main>
        </div>
    );
};

export default Layout;