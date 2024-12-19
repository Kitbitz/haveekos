import React from 'react';
import { BellRing } from 'lucide-react';
import { useFirestore } from '../context/FirestoreContext';

const Announcement: React.FC = () => {
  const { announcementSettings } = useFirestore();

  if (!announcementSettings?.isEnabled || !announcementSettings.content) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-1.5">
          <BellRing className="w-4 h-4 text-blue-700" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-blue-900 leading-snug">
            {announcementSettings.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcement;