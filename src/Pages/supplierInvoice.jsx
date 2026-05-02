import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateSupplierInvoice = (sup) => {
  const doc = new jsPDF();

  const primaryColor = [71, 85, 105]; 
  
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SHAH AGRO BUSINESS", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Supplier Ledger & Payment Record", 14, 28);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("SUPPLIER:", 14, 45);
  doc.setFont("helvetica", "bold");
  doc.text(sup.supplierName || "N/A", 14, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Contact: ${sup.contact || "N/A"}`, 14, 55);

  const dateStr = sup.createdAt?.toDate 
    ? sup.createdAt.toDate().toLocaleDateString() 
    : sup.createdAt?.seconds 
      ? new Date(sup.createdAt.seconds * 1000).toLocaleDateString()
      : new Date().toLocaleDateString();

  doc.text(`Date: ${dateStr}`, 140, 50);
  doc.text(`Record ID: SUP-${sup.id?.substring(0, 5).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`, 140, 45);

  const tableData = [[
    "1",
    sup.itemName || "N/A",
    sup.quantity?.toString() || "0",
    `PKR ${sup.pricePerItem?.toLocaleString() || "0"}`,
    `PKR ${sup.totalPrice?.toLocaleString() || "0"}`,
    `PKR ${sup.paidAmount?.toLocaleString() || "0"}`,
    `PKR ${sup.remainingBalance?.toLocaleString() || "0"}`
  ]];

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Item', 'Qty', 'Unit Price', 'Total', 'Paid', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { 
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  });

  const finalY = (doc.lastAutoTable?.finalY || 75) + 15;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  
  doc.text("Total Amount:", 130, finalY);
  doc.text(`PKR ${sup.totalPrice?.toLocaleString() || "0"}`, 196, finalY, { align: "right" });
  
  doc.text("Amount Paid:", 130, finalY + 7);
  doc.text(`PKR ${sup.paidAmount?.toLocaleString() || "0"}`, 196, finalY + 7, { align: "right" });
  
  doc.setTextColor(sup.remainingBalance > 0 ? 220 : 34, sup.remainingBalance > 0 ? 38 : 197, sup.remainingBalance > 0 ? 38 : 94);
  doc.text("Remaining Balance:", 130, finalY + 14);
  doc.text(`PKR ${sup.remainingBalance?.toLocaleString() || "0"}`, 196, finalY + 14, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Supplier Payment Record - Shah Agro", 105, finalY + 35, { align: "center" });
  doc.text("Powered by Virtual Tech Solution", 105, finalY + 42, { align: "center" });

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
