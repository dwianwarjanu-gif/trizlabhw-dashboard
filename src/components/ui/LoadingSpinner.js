import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '@/utils/cn';
const LoadingSpinner = ({ size = 'md', className, text }) => {
    const sizeClasses = {
        sm: 'spinner-sm',
        md: 'spinner-md',
        lg: 'spinner-lg'
    };
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center', className), children: [_jsx("div", { className: cn('spinner', sizeClasses[size]) }), text && (_jsx("p", { className: "mt-2 text-sm text-gray-600", children: text }))] }));
};
export default LoadingSpinner;
//# sourceMappingURL=LoadingSpinner.js.map