import pdf from 'pdf-parse';
import fs from 'fs/promises';

export class PDFParser {
  /**
   * Extract text content from a PDF file
   */
  static async parseFile(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }

  /**
   * Extract text from a buffer (for uploaded files)
   */
  static async parseBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to parse PDF buffer: ${error}`);
    }
  }
}
