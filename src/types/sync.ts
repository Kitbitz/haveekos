export interface SyncQueueItem {
  id: string;
  type: 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'error';
  message?: string;
  lastSync?: number;
  pendingChanges: number;
}