export const generateInvoice = (fee: any, payment: any) => {
  return {
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date(),
    billedTo: fee.admission.application.lead.name,
    amount: payment.amount,
    method: payment.method,
    status: 'PAID',
    description: `Fee payment for ${fee.admission.program.name}`
  };
};

export const generateReceipt = (payment: any) => {
  return {
    receiptId: `REC-${payment.id.slice(0, 8)}`,
    transactionId: payment.transactionId,
    receivedFrom: 'Student',
    amount: payment.amount,
    date: payment.createdAt,
  };
};
