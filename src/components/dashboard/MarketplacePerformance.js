import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);
const MarketplacePerformance = ({ data }) => {
    if (!data || data.length === 0) {
        return (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-500", children: "Belum ada data penjualan" }) }));
    }
    // Prepare chart data
    const chartData = {
        labels: data.map(item => item.marketplace?.name || 'Unknown'),
        datasets: [
            {
                data: data.map(item => item._sum?.totalAmount || 0),
                backgroundColor: [
                    '#3B82F6', // Blue
                    '#10B981', // Green
                    '#F59E0B', // Yellow
                    '#EF4444', // Red
                    '#8B5CF6', // Purple
                    '#06B6D4', // Cyan
                    '#84CC16', // Lime
                    '#F97316', // Orange
                ],
                borderColor: [
                    '#2563EB',
                    '#059669',
                    '#D97706',
                    '#DC2626',
                    '#7C3AED',
                    '#0891B2',
                    '#65A30D',
                    '#EA580C',
                ],
                borderWidth: 2,
            },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                    }
                }
            }
        },
    };
    const totalRevenue = data.reduce((sum, item) => sum + (item._sum?.totalAmount || 0), 0);
    const totalOrders = data.reduce((sum, item) => sum + (item._count?._all || 0), 0);
    return (_jsxs("div", { children: [_jsx("div", { className: "h-64 mb-6", children: _jsx(Doughnut, { data: chartData, options: options }) }), _jsx("div", { className: "space-y-3", children: data.map((item, index) => {
                    const revenue = item._sum?.totalAmount || 0;
                    const orders = item._count?._all || 0;
                    const percentage = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0';
                    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: {
                                            backgroundColor: chartData.datasets[0].backgroundColor[index % chartData.datasets[0].backgroundColor.length]
                                        } }), _jsx("span", { className: "text-sm font-medium text-gray-900", children: item.marketplace?.name || 'Unknown' })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: [percentage, "%"] }), _jsxs("p", { className: "text-xs text-gray-500", children: [orders, " pesanan"] })] })] }, item.marketplaceAccountId));
                }) }), _jsxs("div", { className: "mt-4 pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Total Pendapatan:" }), _jsxs("span", { className: "font-medium text-gray-900", children: ["Rp ", totalRevenue.toLocaleString('id-ID')] })] }), _jsxs("div", { className: "flex justify-between text-sm mt-1", children: [_jsx("span", { className: "text-gray-500", children: "Total Pesanan:" }), _jsx("span", { className: "font-medium text-gray-900", children: totalOrders.toLocaleString('id-ID') })] })] })] }));
};
export default MarketplacePerformance;
//# sourceMappingURL=MarketplacePerformance.js.map