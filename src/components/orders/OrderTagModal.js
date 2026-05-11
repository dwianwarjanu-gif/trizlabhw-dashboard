import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
const OrderTagModal = ({ isOpen, onClose }) => {
    if (!isOpen)
        return null;
    return (_jsxs("div", { style: { background: "#fff", padding: 20 }, children: [_jsx("h2", { children: "Order Tag" }), _jsx("button", { onClick: onClose, children: "Close" })] }));
};
export default OrderTagModal;
//# sourceMappingURL=OrderTagModal.js.map