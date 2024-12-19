import { useState, useCallback } from 'react';

export interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

export const useExportProgress = () => {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const startExport = useCallback(() => {
    setIsExporting(true);
    setError(null);
    setProgress(null);
  }, []);

  const updateProgress = useCallback((newProgress: ExportProgress) => {
    setProgress(newProgress);
  }, []);

  const completeExport = useCallback(() => {
    setIsExporting(false);
    setProgress(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsExporting(false);
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsExporting(false);
  }, []);

  return {
    progress,
    error,
    isExporting,
    startExport,
    updateProgress,
    completeExport,
    handleError,
    reset
  };
};