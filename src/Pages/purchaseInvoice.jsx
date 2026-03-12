import jsPDF from "jspdf";
import "jspdf-autotable";

export const generatePurchaseInvoice = (purchase) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Purchase Invoice", 14, 20);

  doc.setFontSize(11);
  doc.text(`Supplier: ${purchase.supplier}`, 14, 30);
  doc.text(`Date: ${purchase.date}`, 14, 36);

  const rows = purchase.items.map((i, idx) => [
    idx + 1,
    i.name,
    i.category,
    i.quantity,
    i.unitPrice,
    i.quantity * i.unitPrice,
  ]);

  doc.autoTable({
    startY: 45,
    head: [["#", "Item", "Category", "Qty", "Price", "Total"]],
    body: rows,
  });

  doc.text(
    `Grand Total: PKR ${purchase.total}`,
    14,
    doc.lastAutoTable.finalY + 10
  );

  doc.save(`Purchase-${purchase.supplier}-${purchase.date}.pdf`);
};
