import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { cn } from '@/utils/cn';
const ReportCard = ({ title, value, change, icon: Icon, color, subtitle }) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-blue-600',
        green: 'bg-green-500 text-green-600',
        red: 'bg-red-500 text-red-600',
        purple: 'bg-purple-500 text-purple-600',
        yellow: 'bg-yellow-500 text-yellow-600'
    };
    const hasPositiveChange = change !== undefined && change > 0;
    const hasNegativeChange = change !== undefined && change < 0;
    return (_jsx("div", { className: "bg-white overflow-hidden shadow-soft rounded-lg", children: _jsx("div", { className: "p-5", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: cn('w-8 h-8 rounded-md flex items-center justify-center', colorClasses[color].split(' ')[0], 'bg-opacity-10'), children: _jsx(Icon, { className: cn('w-5 h-5', colorClasses[color].split(' ')[1]) }) }) }), _jsx("div", { className: "ml-5 w-0 flex-1", children: _jsxs("dl", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500 truncate", children: title }), _jsxs("dd", { className: "flex items-baseline", children: [_jsx("div", { className: "text-2xl font-semibold text-gray-900", children: typeof value === 'number' ? value.toLocaleString('id-ID') : value }), change !== undefined && (_jsxs("div", { className: cn('ml-2 flex items-baseline text-sm font-semibold', hasPositiveChange ? 'text-green-600' : hasNegativeChange ? 'text-red-600' : 'text-gray-500'), children: [hasPositiveChange && (_jsx(ArrowUpIcon, { className: "self-center flex-shrink-0 h-4 w-4 text-green-500" })), hasNegativeChange && (_jsx(ArrowDownIcon, { className: "self-center flex-shrink-0 h-4 w-4 text-red-500" })), _jsxs("span", { className: "sr-only", children: [hasPositiveChange ? 'Increased' : hasNegativeChange ? 'Decreased' : 'No change', " by"] }), Math.abs(change).toFixed(1), "%"] }))] }), subtitle && (_jsx("dd", { className: "text-sm text-gray-500 mt-1", children: subtitle }))] }) })] }) }) }));
};
export default ReportCard;
//# sourceMappingURL=ReportCard.js.map