import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class DocumentGeneratorService {
  private outputDir = path.join(__dirname, '../../uploads/documents');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateAdmissionLetter(admissionData: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `admission_${admissionData.enrollmentId}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(25).text('CentraCRM University', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text('Admission Confirmation Letter', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Dear ${admissionData.studentName},`);
        doc.moveDown();
        doc.text(`Congratulations! We are pleased to inform you that your admission to the ${admissionData.programName} program has been confirmed.`);
        doc.moveDown();
        doc.text(`Your Enrollment ID is: ${admissionData.enrollmentId}`);
        doc.moveDown();
        doc.text('We look forward to welcoming you to our campus.');
        doc.moveDown(2);
        doc.text('Sincerely,\nAdmissions Office\nCentraCRM');

        doc.end();

        stream.on('finish', () => resolve(`/uploads/documents/${fileName}`));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateReceipt(paymentData: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `receipt_${paymentData.transactionId}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).text('Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Receipt No: ${paymentData.transactionId}`);
        doc.text(`Date: ${new Date(paymentData.date).toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Received from: ${paymentData.studentName}`);
        doc.text(`Amount: $${paymentData.amount.toFixed(2)}`);
        doc.text(`Payment Method: ${paymentData.method}`);
        doc.moveDown();
        doc.text('Thank you for your payment.', { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(`/uploads/documents/${fileName}`));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new DocumentGeneratorService();
