import React from "react";

const OrderTagModal = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div style={{ background: "#fff", padding: 20 }}>
      <h2>Order Tag</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default OrderTagModal;