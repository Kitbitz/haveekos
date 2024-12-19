import React from 'react'
import { Bell } from 'lucide-react'

interface NotificationProps {
  message: string
  onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto bg-blue-500 text-white p-4 rounded-lg shadow-lg flex items-center">
      <Bell className="w-5 h-5 mr-2 flex-shrink-0" />
      <span className="flex-grow">{message}</span>
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 flex-shrink-0">
        &times;
      </button>
    </div>
  )
}

export default Notification