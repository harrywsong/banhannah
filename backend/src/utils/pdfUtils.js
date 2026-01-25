// backend/src/utils/pdfUtils.js
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { logger } from './logger.js';

/**
 * Extract page count from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<number|null>} - Number of pages or null if extraction fails
 */
export async function extractPdfPageCount(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.warn(`PDF file not found: ${filePath}`);
      return null;
    }

    // Read the PDF file
    const pdfBytes = fs.readFileSync(filePath);
    
    // Parse the PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    logger.info(`Successfully extracted page count from PDF: ${pageCount} pages`);
    return pageCount;
  } catch (error) {
    logger.error(`Failed to extract page count from PDF: ${error.message}`);
    return null;
  }
}

/**
 * Get page count for different file formats
 * @param {string} filePath - Path to the file
 * @param {string} format - File format (PDF, DOCX, etc.)
 * @returns {Promise<number|null>} - Number of pages or null if not applicable/extractable
 */
export async function getFilePageCount(filePath, format) {
  try {
    const upperFormat = format.toUpperCase();
    
    switch (upperFormat) {
      case 'PDF':
        return await extractPdfPageCount(filePath);
      
      case 'DOCX':
      case 'DOC':
        // For now, we'll return null for Word documents
        // In the future, we could add support for these formats
        logger.info(`Page count extraction not yet supported for ${upperFormat} files`);
        return null;
      
      case 'TXT':
        // For text files, we could estimate pages based on content length
        // For now, return null
        return null;
      
      default:
        // For other formats (ZIP, images, etc.), page count doesn't apply
        return null;
    }
  } catch (error) {
    logger.error(`Error getting page count for ${format} file: ${error.message}`);
    return null;
  }
}

/**
 * Update page count for existing files in the database
 * This function can be used to backfill page counts for existing files
 */
export async function updateExistingFilePageCounts(prisma, storageService) {
  try {
    logger.info('Starting to update page counts for existing files...');
    
    // Get all PDF files without page count
    const pdfFiles = await prisma.file.findMany({
      where: {
        format: 'PDF',
        pageCount: null
      }
    });
    
    logger.info(`Found ${pdfFiles.length} PDF files to process`);
    
    let updated = 0;
    let failed = 0;
    
    for (const file of pdfFiles) {
      try {
        const filePath = storageService.getFilePath(file.filename, 'uploads');
        const pageCount = await extractPdfPageCount(filePath);
        
        if (pageCount !== null) {
          await prisma.file.update({
            where: { id: file.id },
            data: { pageCount }
          });
          updated++;
          logger.info(`Updated page count for file ${file.id}: ${pageCount} pages`);
        } else {
          failed++;
          logger.warn(`Failed to extract page count for file ${file.id}`);
        }
      } catch (error) {
        failed++;
        logger.error(`Error processing file ${file.id}: ${error.message}`);
      }
    }
    
    logger.info(`Page count update completed. Updated: ${updated}, Failed: ${failed}`);
    return { updated, failed };
  } catch (error) {
    logger.error(`Error updating existing file page counts: ${error.message}`);
    throw error;
  }
}