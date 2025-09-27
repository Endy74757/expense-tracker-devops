import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, fetchCurrentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const accessToken = await login(email, password);
            await fetchCurrentUser(accessToken); // Fetch user data right after login
            navigate('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>เข้าสู่ระบบ</h1>
            <form onSubmit={handleLogin}>
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
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>ยังไม่มีบัญชี? <Link to="/register">สร้างบัญชีใหม่</Link></p>
            </div>
        </div>
    );
};

export default Login;