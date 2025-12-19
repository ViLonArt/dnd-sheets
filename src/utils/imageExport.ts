import html2canvas from 'html2canvas'
import type { RefObject } from 'react'

/**
 * Flatten input elements to divs for accurate image rendering
 * This fixes vertical alignment issues with html2canvas using aggressive flexbox centering
 * Shared between PDF and PNG exports
 */
export function flattenInputs(clonedDoc: Document): void {
  // Get all input and textarea elements
  const inputs = clonedDoc.querySelectorAll('input, textarea, select')
  
  inputs.forEach((element) => {
    const htmlElement = element as HTMLElement
    const computedStyle = window.getComputedStyle(htmlElement)
    
    // Create a div to replace the input (div gives better control than span)
    const replacementDiv = clonedDoc.createElement('div')
    
    // Get the value/text content
    let textContent = ''
    const isTextarea = element instanceof HTMLTextAreaElement
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      textContent = element.value || element.placeholder || ''
    } else if (element instanceof HTMLSelectElement) {
      textContent = element.options[element.selectedIndex]?.text || ''
    }
    
    // Determine text alignment for justifyContent
    const textAlign = computedStyle.textAlign
    const justifyContent = 
      textAlign === 'center' ? 'center' :
      textAlign === 'right' ? 'flex-end' :
      'flex-start'
    
    // Force flexbox centering - this is the key fix
    replacementDiv.style.display = 'flex'
    replacementDiv.style.alignItems = 'center' // Perfectly centers text vertically
    replacementDiv.style.justifyContent = justifyContent
    
    // Keep exact dimensions of original input
    replacementDiv.style.height = computedStyle.height
    replacementDiv.style.width = computedStyle.width
    replacementDiv.style.minHeight = computedStyle.minHeight
    replacementDiv.style.boxSizing = 'border-box'
    
    // Apply vertical offset fix: pull element up to compensate for html2canvas rendering lower
    replacementDiv.style.marginTop = '-3px' // Pull the element up to fix vertical offset
    
    // Adjust padding to shift visual center upwards
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0
    replacementDiv.style.paddingTop = '0px' // Remove top padding to shift up
    replacementDiv.style.paddingBottom = `${(parseFloat(computedStyle.paddingBottom) || 0) + 4}px` // Add extra bottom padding
    replacementDiv.style.paddingLeft = computedStyle.paddingLeft
    replacementDiv.style.paddingRight = computedStyle.paddingRight
    
    // Copy typography styles
    replacementDiv.style.fontSize = computedStyle.fontSize
    replacementDiv.style.fontFamily = computedStyle.fontFamily
    replacementDiv.style.fontWeight = computedStyle.fontWeight
    replacementDiv.style.color = computedStyle.color
    
    // Handle white-space differently for textareas vs inputs
    if (isTextarea) {
      // Textareas: preserve line breaks
      replacementDiv.style.whiteSpace = 'pre-wrap'
      replacementDiv.style.wordWrap = 'break-word'
      replacementDiv.style.alignItems = 'flex-start' // Top-align for multiline
    } else {
      // Single-line inputs: prevent wrapping
      replacementDiv.style.whiteSpace = 'nowrap'
      replacementDiv.style.textOverflow = 'ellipsis'
    }
    
    // Set overflow to visible to prevent clipping (better than cutting off text)
    replacementDiv.style.overflow = 'visible'
    
    // Copy visual styles (but remove border to avoid double-border issues)
    replacementDiv.style.backgroundColor = computedStyle.backgroundColor
    replacementDiv.style.border = 'none' // Remove border to avoid double-border issues
    replacementDiv.style.borderRadius = computedStyle.borderRadius
    
    // Set text content
    replacementDiv.textContent = textContent
    
    // Replace the input with the div
    if (htmlElement.parentNode) {
      htmlElement.parentNode.replaceChild(replacementDiv, htmlElement)
    }
  })
}

/**
 * Export element to PNG
 * @param elementRef - Reference to the HTML element to export
 * @param filename - Name of the PNG file
 */
export async function exportToPng(
  elementRef: RefObject<HTMLElement>,
  filename: string
): Promise<void> {
  if (!elementRef.current) {
    throw new Error('Element reference is not available')
  }

  // Capture the element as canvas with high DPI for crisp text
  const canvas = await html2canvas(elementRef.current, {
    backgroundColor: null,
    scale: 4,
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      // Flatten all input elements to divs for accurate rendering
      flattenInputs(clonedDoc)
    },
  })

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

