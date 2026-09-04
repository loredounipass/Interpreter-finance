import { useState, useCallback } from 'react'
import { generateProfessionalPDF, DownloadData } from '@/utils/pdf-generator'
import { authHeaders } from '@/lib/api-auth'

// MANAGES DOWNLOAD STATE AND INTERACTS WITH THE DOWNLOAD API TO GENERATE PDF REPORTS
export function useDownloads() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // CALLS THE API AND TRIGGERS PDF GENERATION BASED ON THE SPECIFIED DATE RANGE
  const downloadReport = useCallback(async (fromDate: string, toDate: string) => {
    setIsDownloading(true)
    setError(null)
    
    try {
      const headers = await authHeaders()
      if (!headers.Authorization) {
        throw new Error('You must be logged in to download reports.')
      }

      const queryParams = new URLSearchParams()
      if (fromDate) queryParams.set('from', fromDate)
      if (toDate) queryParams.set('to', toDate)
      
      const response = await fetch(`/api/downloads?${queryParams.toString()}`, { headers })
      
      if (!response.ok) {
        throw new Error('Failed to fetch data for the report.')
      }

      const data: DownloadData = await response.json()
      
      if (data.entries.length === 0) {
        throw new Error('No data found for the selected period.')
      }

      generateProfessionalPDF(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report.')
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return { isDownloading, error, downloadReport }
}
