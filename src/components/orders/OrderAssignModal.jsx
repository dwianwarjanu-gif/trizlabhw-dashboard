import React from "react";

const OrderAssignModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{ background: "#fff", padding: 20 }}>
      <h2>Assign Order</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default OrderAssignModal;
