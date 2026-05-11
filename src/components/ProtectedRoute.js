import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
const ProtectedRoute = ({ children }) => {
    const { user, token, isLoading } = useAuth();
    if (isLoading) {
        return _jsx("div", { children: "Loading..." });
    }
    if (!token) return <Navigate to="/login" replace />
    }
    return _jsx(_Fragment, { children: children });

export default ProtectedRoute;
//# sourceMappingURL=ProtectedRoute.js.map