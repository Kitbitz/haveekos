import React from 'react';
import { Download } from 'lucide-react';
import { useGoogleSheets } from '../context/GoogleSheetsContext';

interface ExportControlsProps {
  onExport: () => Promise<any[][]>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const ExportControls: React.FC<ExportControlsProps> = ({ onExport, dateRange }) => {
  const { isAuthenticated, authenticate, exportToSheets } = useGoogleSheets();

  const handleExport = async () => {
    try {
      if (!isAuthenticated) {
        await authenticate();
      }
      const data = await onExport();
      await exportToSheets(data);
      alert('Data exported successfully to Google Sheets!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
    >
      <Download className="w-4 h-4 mr-2" />
      Export to Sheets
    </button>
  );
};

export default ExportControls;