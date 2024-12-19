import React from 'react';
import { Loader } from 'lucide-react';

interface ExportProgressProps {
  current: number;
  total: number;
  status: string;
}

const ExportProgress: React.FC<ExportProgressProps> = ({ current, total, status }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <Loader className="w-6 h-6 text-blue-500 animate-spin mr-3" />
          <h3 className="text-lg font-semibold">Exporting Data</h3>
        </div>
        
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{current} of {total}</span>
            <span>{percentage}%</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default ExportProgress;