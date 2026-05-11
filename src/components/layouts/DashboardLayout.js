import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ShoppingBagIcon, ClipboardDocumentListIcon, CubeIcon, BuildingStorefrontIcon, ChartBarIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { cn } from '@/utils/cn';
const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Produk', href: '/products', icon: ShoppingBagIcon },
    { name: 'Pesanan', href: '/orders', icon: ClipboardDocumentListIcon },
    { name: 'Inventori', href: '/inventory', icon: CubeIcon },
    { name: 'Marketplace', href: '/marketplaces', icon: BuildingStorefrontIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Pengaturan', href: '/settings', icon: Cog6ToothIcon },
];
const DashboardLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isConnected } = useSocket();
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("div", { className: cn('fixed inset-0 z-50 lg:hidden', sidebarOpen ? 'block' : 'hidden'), children: [_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-75", onClick: () => setSidebarOpen(false) }), _jsxs("div", { className: "fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl", children: [_jsxs("div", { className: "flex h-16 items-center justify-between px-4", children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Marketplace Integration" }), _jsx("button", { onClick: () => setSidebarOpen(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(XMarkIcon, { className: "h-6 w-6" }) })] }), _jsx("nav", { className: "flex-1 space-y-1 px-2 py-4", children: navigation.map((item) => {
                                    const isActive = location.pathname === item.href ||
                                        (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                                    return (_jsxs(Link, { to: item.href, onClick: () => setSidebarOpen(false), className: cn('group flex items-center px-2 py-2 text-sm font-medium rounded-md', isActive
                                            ? 'bg-primary-100 text-primary-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'), children: [_jsx(item.icon, { className: cn('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500') }), item.name] }, item.name));
                                }) })] })] }), _jsx("div", { className: "hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col", children: _jsxs("div", { className: "flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto", children: [_jsx("div", { className: "flex items-center flex-shrink-0 px-4", children: _jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Marketplace Integration" }) }), _jsx("nav", { className: "mt-8 flex-1 space-y-1 px-2", children: navigation.map((item) => {
                                const isActive = location.pathname === item.href ||
                                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                                return (_jsxs(Link, { to: item.href, className: cn('group flex items-center px-2 py-2 text-sm font-medium rounded-md', isActive
                                        ? 'bg-primary-100 text-primary-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'), children: [_jsx(item.icon, { className: cn('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500') }), item.name] }, item.name));
                            }) }), _jsx("div", { className: "flex-shrink-0 px-4 py-2", children: _jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx("div", { className: cn('w-2 h-2 rounded-full mr-2', isConnected ? 'bg-green-400' : 'bg-red-400') }), isConnected ? 'Terhubung' : 'Terputus'] }) })] }) }), _jsxs("div", { className: "lg:pl-64 flex flex-col flex-1", children: [_jsxs("div", { className: "sticky top-0 z-40 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8", children: [_jsx("button", { type: "button", className: "-m-2.5 p-2.5 text-gray-700 lg:hidden", onClick: () => setSidebarOpen(true), children: _jsx(Bars3Icon, { className: "h-6 w-6" }) }), _jsx("div", { className: "h-6 w-px bg-gray-200 lg:hidden" }), _jsxs("div", { className: "flex flex-1 gap-x-4 self-stretch lg:gap-x-6", children: [_jsx("div", { className: "relative flex flex-1" }), _jsxs("div", { className: "flex items-center gap-x-4 lg:gap-x-6", children: [_jsx("button", { type: "button", className: "-m-2.5 p-2.5 text-gray-400 hover:text-gray-500", children: _jsx(BellIcon, { className: "h-6 w-6" }) }), _jsx("div", { className: "hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" }), _jsx("div", { className: "relative", children: _jsxs("button", { type: "button", className: "flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900", children: [_jsx(UserCircleIcon, { className: "h-8 w-8 text-gray-400" }), _jsx("span", { className: "hidden lg:block", children: user?.fullName })] }) }), _jsx("button", { onClick: logout, className: "text-sm text-gray-500 hover:text-gray-700", children: "Keluar" })] })] })] }), _jsx("main", { className: "flex-1", children: _jsx("div", { className: "py-6", children: _jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", children: children }) }) })] })] }));
};
export default DashboardLayout;
//# sourceMappingURL=DashboardLayout.js.map