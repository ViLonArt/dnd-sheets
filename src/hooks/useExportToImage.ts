import { useState } from 'react'
import type { RefObject } from 'react'
import { exportToPdf } from '@/utils/pdf'
import { exportToPng } from '@/utils/imageExport'

export function useExportToImage() {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPdfFile = async (
    elementRef: RefObject<HTMLElement>,
    filename: string
  ): Promise<void> => {
    if (!elementRef.current) {
      throw new Error('Element reference is not available')
    }

    setIsExporting(true)
    try {
      await exportToPdf(elementRef, filename)
    } catch (error) {
      console.error('Export error:', error)
      throw new Error('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPngFile = async (
    elementRef: RefObject<HTMLElement>,
    filename: string
  ): Promise<void> => {
    if (!elementRef.current) {
      throw new Error('Element reference is not available')
    }

    setIsExporting(true)
    try {
      await exportToPng(elementRef, filename)
    } catch (error) {
      console.error('Export error:', error)
      throw new Error('Failed to export PNG: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  return { exportToPdf: exportToPdfFile, exportToPng: exportToPngFile, isExporting }
}

