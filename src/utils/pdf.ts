import html2canvas from 'html2canvas'
import type { RefObject } from 'react'
import { prepareDomForExport } from './imageExport'

// Dynamic import for jspdf to handle cases where it's not installed
let jsPDF: typeof import('jspdf').jsPDF | null = null

async function loadJsPDF() {
  if (jsPDF) return jsPDF
  try {
    const jspdfModule = await import('jspdf')
    jsPDF = jspdfModule.jsPDF
    return jsPDF
  } catch (error) {
    throw new Error('jspdf is not installed. Please run: npm install jspdf')
  }
}

/**
 * Export element to PDF
 * @param elementRef - Reference to the HTML element to export
 * @param filename - Name of the PDF file
 */
export async function exportToPdf(
  elementRef: RefObject<HTMLElement>,
  filename: string
): Promise<void> {
  if (!elementRef.current) {
    throw new Error('Element reference is not available')
  }

  // Load jsPDF
  const PDF = await loadJsPDF()

  // Capture the element as canvas with high DPI for crisp text
  const canvas = await html2canvas(elementRef.current, {
    backgroundColor: null,
    scale: 3, // High scale for better quality
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      // Prepare DOM for export: flatten all input elements to divs for accurate rendering
      prepareDomForExport(clonedDoc)
    },
  })

  const imgData = canvas.toDataURL('image/png')

  // A4 dimensions in mm
  const a4Width = 210
  const a4Height = 297

  // Calculate dimensions maintaining aspect ratio
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = imgWidth / imgHeight

  let pdfWidth = a4Width
  let pdfHeight = a4Width / ratio

  // If height exceeds A4, scale down to fit
  if (pdfHeight > a4Height) {
    pdfHeight = a4Height
    pdfWidth = a4Height * ratio
  }

  // Create PDF
  const pdf = new PDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  })

  // Add image to PDF (centered)
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')

  // Save PDF
  pdf.save(filename)
}

