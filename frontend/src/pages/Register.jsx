import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            await register(name, email, password);
            setSuccess('ลงทะเบียนสำเร็จ! กำลังนำคุณไปยังหน้า Login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000); // รอ 2 วินาทีก่อนเปลี่ยนหน้า
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>สร้างบัญชีใหม่</h1>
            <form onSubmit={handleRegister}>
                <div className="form-group">
                    <label>ชื่อ</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>อีเมล</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>รหัสผ่าน</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'กำลังลงทะเบียน...' : 'Register'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบที่นี่</Link></p>
            </div>
        </div>
    );
};

export default Register;