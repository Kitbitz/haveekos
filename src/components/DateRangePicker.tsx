import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          disabled={disabled}
          className={`
            pl-10 pr-3 py-2 border rounded-md
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
      </div>
      <span className="text-gray-500">to</span>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          disabled={disabled}
          min={startDate}
          className={`
            pl-10 pr-3 py-2 border rounded-md
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;