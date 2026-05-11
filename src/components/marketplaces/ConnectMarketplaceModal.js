import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
const ConnectMarketplaceModal = ({ isOpen, onClose }) => {
    if (!isOpen)
        return null;
    return (_jsxs("div", { style: { background: "#fff", padding: 20 }, children: [_jsx("h2", { children: "Connect Marketplace" }), _jsx("button", { onClick: onClose, children: "Close" })] }));
};
export default ConnectMarketplaceModal;
//# sourceMappingURL=ConnectMarketplaceModal.js.map