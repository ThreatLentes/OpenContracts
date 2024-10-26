import React from "react";
import { Icon } from "semantic-ui-react";

interface ExtractCellFormatterProps {
  value: string;
  cellStatus: {
    isLoading: boolean;
    isApproved: boolean;
    isRejected: boolean;
    isEdited: boolean;
    originalData: any;
    correctedData: any;
    error?: any;
  };
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  // Include any additional props if necessary
}

export const ExtractCellFormatter: React.FC<ExtractCellFormatterProps> = ({
  value,
  cellStatus,
  onApprove,
  onReject,
  onEdit,
}) => {
  const cellStyle = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "100%",
    padding: "0 8px",
  };

  if (cellStatus.isLoading) {
    return (
      <div style={cellStyle}>
        <Icon name="spinner" loading />
      </div>
    );
  }

  return (
    <div style={cellStyle}>
      {value}
      {cellStatus.isApproved && (
        <Icon name="check" color="green" style={{ marginLeft: "auto" }} />
      )}
      {cellStatus.isRejected && (
        <Icon name="x" color="red" style={{ marginLeft: "auto" }} />
      )}
      {cellStatus.isEdited && (
        <Icon name="edit" color="blue" style={{ marginLeft: "auto" }} />
      )}
    </div>
  );
};
