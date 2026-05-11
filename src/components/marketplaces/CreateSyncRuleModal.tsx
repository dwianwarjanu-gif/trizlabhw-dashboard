import React from "react";

const CreateSyncRuleModal = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div style={{ background: "#fff", padding: 20 }}>
      <h2>Create Sync Rule</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default CreateSyncRuleModal;