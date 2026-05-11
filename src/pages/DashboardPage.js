import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Dashboard" }), _jsxs("div", { className: "mb-4", children: [_jsx("p", { className: "text-green-600 font-semibold", children: "Login berhasil" }), _jsxs("p", { children: ["User: ", user?.email] })] }), _jsx("button", { onClick: handleLogout, className: "bg-red-500 text-white px-4 py-2 rounded", children: "Logout" })] }));
};
export default DashboardPage;
//# sourceMappingURL=DashboardPage.js.map