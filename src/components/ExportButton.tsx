import React from 'react';
import { FileSpreadsheet, Loader } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onClick, isLoading, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`
        inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
        ${disabled || isLoading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'}
        transition-colors duration-200
      `}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export to Sheets
        </>
      )}
    </button>
  );
};

export default ExportButton;