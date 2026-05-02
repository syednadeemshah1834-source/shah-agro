import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePurchaseInvoice = (p) => {
  const doc = new jsPDF();

  // Header - Industrial theme (Blue/Slate)
  const primaryColor = [71, 85, 105]; 
  
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("SHAH AGRO BUSINESS", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Purchase Record & Inventory Management", 14, 28);
  
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);

  // Supplier Info
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("SUPPLIER:", 14, 45);
  doc.setFont("helvetica", "bold");
  doc.text(p.supplierName || "Direct Supplier", 14, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Contact: ${p.cellNo || "N/A"}`, 14, 55);

  const dateStr = p.createdAt?.toDate 
    ? p.createdAt.toDate().toLocaleDateString() 
    : p.createdAt?.seconds 
      ? new Date(p.createdAt.seconds * 1000).toLocaleDateString()
      : new Date().toLocaleDateString();

  doc.text(`Date: ${dateStr}`, 140, 50);
  doc.text(`Purchase ID: PR-${p.id?.substring(0, 5).toUpperCase() || Math.floor(1000 + Math.random() * 9000)}`, 140, 45);

  // Items Table - Updated to use autoTable as a function
  const tableData = [[
    "1",
    p.itemName,
    p.quantity.toString(),
    `PKR ${p.price?.toLocaleString()}`,
    `PKR ${p.total?.toLocaleString()}`
  ]];

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Stock Detail', 'Quantity', 'Unit Cost', 'Sub-Total']],
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
      4: { halign: 'right' }
    }
  });

  // Totals
  const finalY = (doc.lastAutoTable?.finalY || 75) + 15;
  
  doc.setDrawColor(200);
  doc.line(130, finalY - 5, 196, finalY - 5);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total Purchase:", 130, finalY);
  doc.text(`PKR ${p.total?.toLocaleString()}`, 196, finalY, { align: "right" });

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Internal Purchase Record - Shah Agro", 105, finalY + 30, { align: "center" });
  doc.text("Powered by Virtual Tech Solution", 105, finalY + 37, { align: "center" });

  doc.autoPrint();
  const blobUrl = doc.output('bloburl');
  let iframe = document.getElementById('print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  iframe.src = blobUrl;
};
