import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
const Pagination = ({ currentPage, totalPages, onPageChange, showInfo = true, className }) => {
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }
        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        }
        else {
            rangeWithDots.push(1);
        }
        rangeWithDots.push(...range);
        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        }
        else {
            rangeWithDots.push(totalPages);
        }
        return rangeWithDots;
    };
    if (totalPages <= 1)
        return null;
    const visiblePages = getVisiblePages();
    return (_jsxs("div", { className: cn('flex items-center justify-between', className), children: [showInfo && (_jsxs("div", { className: "text-sm text-gray-700", children: ["Halaman ", _jsx("span", { className: "font-medium", children: currentPage }), " dari", ' ', _jsx("span", { className: "font-medium", children: totalPages })] })), _jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", children: [_jsx("button", { onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, className: cn('relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium', currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'), children: _jsx(ChevronLeftIcon, { className: "h-5 w-5" }) }), visiblePages.map((page, index) => {
                        if (page === '...') {
                            return (_jsx("span", { className: "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700", children: "..." }, `dots-${index}`));
                        }
                        const pageNumber = page;
                        const isCurrentPage = pageNumber === currentPage;
                        return (_jsx("button", { onClick: () => onPageChange(pageNumber), className: cn('relative inline-flex items-center px-4 py-2 border text-sm font-medium', isCurrentPage
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'), children: pageNumber }, pageNumber));
                    }), _jsx("button", { onClick: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, className: cn('relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium', currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'), children: _jsx(ChevronRightIcon, { className: "h-5 w-5" }) })] })] }));
};
export default Pagination;
//# sourceMappingURL=Pagination.js.map