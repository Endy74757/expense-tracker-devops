import React from 'react';
import UpdateNameForm from '../components/UpdateNameForm';
import UpdatePasswordForm from '../components/UpdatePasswordForm';

const SettingsPage = () => {
    return (
        <div className="container">
            <h1>ตั้งค่าบัญชี</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
                <UpdateNameForm />
                <UpdatePasswordForm />
            </div>
        </div>
    );
};

export default SettingsPage;