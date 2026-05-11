import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter')
});
const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });
    const onSubmit = async (data) => {
        try {
            await login(data);
        }
        catch (error) {
            // Error handling is done in AuthContext
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900", children: "Masuk ke Akun Anda" }), _jsxs("p", { className: "mt-2 text-sm text-gray-600", children: ["Atau", ' ', _jsx(Link, { to: "/register", className: "font-medium text-primary-600 hover:text-primary-500", children: "daftar akun baru" })] })] }), _jsxs("form", { className: "space-y-6", onSubmit: handleSubmit(onSubmit), children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsxs("div", { className: "mt-1", children: [_jsx("input", { ...register('email'), type: "email", autoComplete: "email", className: `input ${errors.email ? 'input-error' : ''}`, placeholder: "nama@email.com" }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email.message }))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsxs("div", { className: "mt-1 relative", children: [_jsx("input", { ...register('password'), type: showPassword ? 'text' : 'password', autoComplete: "current-password", className: `input pr-10 ${errors.password ? 'input-error' : ''}`, placeholder: "Masukkan password" }), _jsx("button", { type: "button", className: "absolute inset-y-0 right-0 pr-3 flex items-center", onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeSlashIcon, { className: "h-5 w-5 text-gray-400" })) : (_jsx(EyeIcon, { className: "h-5 w-5 text-gray-400" })) }), errors.password && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password.message }))] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "remember-me", name: "remember-me", type: "checkbox", className: "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "remember-me", className: "ml-2 block text-sm text-gray-900", children: "Ingat saya" })] }), _jsx("div", { className: "text-sm", children: _jsx("a", { href: "#", className: "font-medium text-primary-600 hover:text-primary-500", children: "Lupa password?" }) })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "btn btn-primary btn-md w-full", children: isLoading ? (_jsx(LoadingSpinner, { size: "sm" })) : ('Masuk') }) })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "Atau masuk dengan" }) })] }), _jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3", children: [_jsxs("button", { type: "button", className: "btn btn-outline btn-md w-full", disabled: true, children: [_jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] }), "Google"] }), _jsxs("button", { type: "button", className: "btn btn-outline btn-md w-full", disabled: true, children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) }), "Facebook"] })] })] })] }));
};
export default LoginPage;
//# sourceMappingURL=LoginPage.js.map