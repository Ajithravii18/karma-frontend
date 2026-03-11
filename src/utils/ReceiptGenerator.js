import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateReceipt = (data) => {
  const { txnId, amount, userName, serviceName, date } = data;
  const doc = new jsPDF();

  // --- Header & Branding ---
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // Eco-Green
  doc.text("E - Karma", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Official Payment Receipt", 105, 28, { align: "center" });
  
  // --- Transaction ID Header ---
  doc.setFontSize(9);
  doc.setTextColor(50);
  doc.text(`Transaction ID: ${txnId || "N/A"}`, 105, 36, { align: "center" });

  // --- Table Construction ---
  autoTable(doc, {
    startY: 45,
    head: [['Description', 'Information']],
    body: [
      ['Customer Name', userName || "Valued Citizen"],
      ['Service Type', serviceName || "Waste Management"],
      ['Date of Service', date || new Date().toLocaleDateString()],
      ['Transaction ID', txnId || "N/A"],
      ['Payment Status', 'PAID / SUCCESS'],
      ['Amount Paid', `INR ${amount || "50.00"}`]
    ],
    headStyles: { 
        fillColor: [22, 163, 74], 
        fontStyle: 'bold',
        halign: 'center' 
    },
    styles: { fontSize: 10, cellPadding: 5 },
    theme: 'grid',
  });

  // --- Footer ---
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for contributing to a cleaner environment!", 105, finalY, { align: "center" });
  
  doc.setFontSize(8);
  doc.text("This is a computer-generated receipt and does not require a signature.", 105, finalY + 6, { align: "center" });

  // --- Download ---
  doc.save(`Receipt_EKarma_${txnId ? txnId.slice(-6) : "Success"}.pdf`);
};