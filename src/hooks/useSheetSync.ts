import { useState, useCallback } from 'react'
import { Order } from '../App'
import { sheetSyncService } from '../services/sheetSyncService'
import { GoogleSheetsError } from '../utils/errorHandling'

const useSheetSync = () => {
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const validateAndPrepareSheet = useCallback(async () => {
    if (isInitialized) return

    try {
      console.log('Starting sheet validation...')
      
      // Verify Google Sheets credentials
      const spreadsheetId = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID
      const clientEmail = import.meta.env.VITE_GOOGLE_CLIENT_EMAIL
      const privateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY

      if (!spreadsheetId || !clientEmail || !privateKey) {
        throw new GoogleSheetsError('Missing required Google Sheets credentials')
      }

      // First validate sheet structure and headers
      const isValid = await sheetSyncService.validateSheetStructure()
      console.log('Sheet structure validation:', isValid)
      
      if (!isValid) {
        // Clear existing data while preserving headers
        await sheetSyncService.clearDataPreservingHeaders()
        console.log('Cleared existing data')
        
        // Verify headers are still intact after clearing
        const headersIntact = await sheetSyncService.verifyHeadersIntact()
        console.log('Headers verification:', headersIntact)
        
        if (!headersIntact) {
          throw new GoogleSheetsError('Sheet headers were corrupted during initialization')
        }
      }

      setIsInitialized(true)
      console.log('Sheet sync initialized successfully')
    } catch (err) {
      console.error('Sheet initialization error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to prepare sheet'
      setError(errorMessage)
      throw err
    }
  }, [isInitialized])

  const syncOrder = useCallback(async (order: Order) => {
    try {
      if (!isInitialized) {
        await validateAndPrepareSheet()
      }

      await sheetSyncService.syncOrderData(order)
      console.log('Order synced successfully:', order.id)
    } catch (err) {
      console.error('Order sync error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync order'
      setError(errorMessage)
      throw err
    }
  }, [isInitialized, validateAndPrepareSheet])

  return {
    validateAndPrepareSheet,
    syncOrder,
    error,
    clearError,
    isInitialized
  }
}

export default useSheetSync