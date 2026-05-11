import React from "react";

const ConnectMarketplaceModal = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div style={{ background: "#fff", padding: 20 }}>
      <h2>Connect Marketplace</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default ConnectMarketplaceModal;