import { PDFParser } from '../src/utils/pdfParser';

describe('PDFParser', () => {
  describe('parseBuffer', () => {
    it('should handle empty buffers gracefully', async () => {
      const emptyBuffer = Buffer.from('');
      
      await expect(PDFParser.parseBuffer(emptyBuffer)).rejects.toThrow();
    });

    it('should reject non-PDF content', async () => {
      const textBuffer = Buffer.from('This is not a PDF file');
      
      await expect(PDFParser.parseBuffer(textBuffer)).rejects.toThrow();
    });
  });

  // Note: For full testing, you'd want to include test PDF files
  // and validate their parsing
});
