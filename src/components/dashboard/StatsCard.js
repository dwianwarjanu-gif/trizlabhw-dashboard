import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';
const StatsCard = ({ title, value, previousValue, growth, icon: Icon, color, format = 'number', alert = false }) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-blue-600',
        green: 'bg-green-500 text-green-600',
        purple: 'bg-purple-500 text-purple-600',
        red: 'bg-red-500 text-red-600',
        yellow: 'bg-yellow-500 text-yellow-600'
    };
    const formatValue = (val) => {
        switch (format) {
            case 'currency':
                return `Rp ${val.toLocaleString('id-ID')}`;
            case 'percentage':
                return `${val.toFixed(1)}%`;
            default:
                return val.toLocaleString('id-ID');
        }
    };
    const isPositiveGrowth = growth && growth > 0;
    const isNegativeGrowth = growth && growth < 0;
    return (_jsx("div", { className: cn('bg-white overflow-hidden shadow-soft rounded-lg', alert && 'ring-2 ring-red-200'), children: _jsxs("div", { className: "p-5", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: cn('w-8 h-8 rounded-md flex items-center justify-center', colorClasses[color].split(' ')[0], 'bg-opacity-10'), children: _jsx(Icon, { className: cn('w-5 h-5', colorClasses[color].split(' ')[1]) }) }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: title }), _jsxs("dd", { className: "flex items-baseline", children: [_jsx("div", { className: "text-2xl font-semibold text-gray-900", children: formatValue(value) }), growth !== undefined && (_jsxs("div", { className: cn('ml-2 flex items-baseline text-sm font-semibold', isPositiveGrowth ? 'text-green-600' : isNegativeGrowth ? 'text-red-600' : 'text-gray-500'), children: [isPositiveGrowth && _jsx(ArrowUpIcon, { className: "w-3 h-3 mr-0.5 flex-shrink-0" }), isNegativeGrowth && _jsx(ArrowDownIcon, { className: "w-3 h-3 mr-0.5 flex-shrink-0" }), Math.abs(growth).toFixed(1), "%"] }))] })] }) })] }), previousValue !== undefined && (_jsxs("div", { className: "mt-3 text-xs text-gray-500", children: ["Periode sebelumnya: ", formatValue(previousValue)] })), alert && (_jsx("div", { className: "mt-2 text-xs text-red-600 font-medium", children: "Perlu perhatian!" }))] }) }));
};
export default StatsCard;
//# sourceMappingURL=StatsCard.js.map