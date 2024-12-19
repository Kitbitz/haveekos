import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGoogleSheets } from '../context/GoogleSheetsContext';

const OAuth2Callback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAccessToken } = useGoogleSheets();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('access_token');

    if (token) {
      setAccessToken(token);
      navigate('/admin/storage');
    } else {
      console.error('No access token received');
      navigate('/admin/storage', { state: { error: 'Authentication failed' } });
    }
  }, [location, navigate, setAccessToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuth2Callback;