import React from 'react';
import { LogIn, Loader } from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface AuthButtonProps {
  onSuccess?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({ onSuccess }) => {
  const { isAuthenticated, isLoading, startAuth, error } = useGoogleAuth();

  const handleAuth = async () => {
    try {
      await startAuth();
      onSuccess?.();
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
      >
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </button>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div>
      <button
        onClick={handleAuth}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Connect Google Sheets
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AuthButton;