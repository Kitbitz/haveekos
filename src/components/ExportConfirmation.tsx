import React from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface ExportConfirmationProps {
  spreadsheetUrl: string;
  onClose: () => void;
}

const ExportConfirmation: React.FC<ExportConfirmationProps> = ({ spreadsheetUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        
        <h3 className="text-xl font-semibold text-center mb-4">
          Export Successful!
        </h3>
        
        <p className="text-gray-600 mb-6 text-center">
          Your data has been successfully exported to Google Sheets.
        </p>
        
        <div className="flex flex-col space-y-4">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Open in Google Sheets
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
          
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportConfirmation;