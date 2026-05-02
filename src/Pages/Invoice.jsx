import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoice = (sale) => {
  const doc = new jsPDF();

  // Header
  const primaryColor = [40, 167, 69]; 
  
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SHAH AGRO BUSINESS", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Agricultural Solutions & Services", 14, 28);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Invoice Info
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("INVOICE TO:", 14, 45);
  doc.setFont("helvetica", "bold");
  doc.text(sale.customerName || "Valued Customer", 14, 50);
  doc.setFont("helvetica", "normal");

  const dateStr = sale.createdAt?.toDate 
    ? sale.createdAt.toDate().toLocaleDateString() 
    : sale.createdAt?.seconds 
      ? new Date(sale.createdAt.seconds * 1000).toLocaleDateString()
      : new Date().toLocaleDateString();

  doc.text(`Date: ${dateStr}`, 140, 50);
  doc.text(`Invoice #: INV-${Math.floor(1000 + Math.random() * 9000)}`, 140, 45);

  // Items Table - Updated to use autoTable as a function
  const tableData = [[
    "1",
    sale.itemName,
    sale.quantity.toString(),
    `PKR ${sale.pricePerItem?.toLocaleString()}`,
    `PKR ${sale.totalAmount?.toLocaleString()}`
  ]];

  autoTable(doc, {
    startY: 60,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
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
      4: { halign: 'right' }
    }
  });

  // Totals
  const finalY = (doc.lastAutoTable?.finalY || 70) + 15;
  
  doc.setDrawColor(200);
  doc.line(130, finalY - 5, 196, finalY - 5);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 130, finalY);
  doc.text(`PKR ${sale.totalAmount?.toLocaleString()}`, 196, finalY, { align: "right" });

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, finalY + 30, { align: "center" });
  doc.text("Shah Agro - Quality Seeds, Fertilizers & More", 105, finalY + 35, { align: "center" });
  doc.text("Powered by Virtual Tech Solution", 105, finalY + 42, { align: "center" });

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
