import jsPDF from "jspdf";

export const generateInvoice = (sale) => {
  const doc = new jsPDF();
  let y = 10;

  doc.text("Shah Agro - Sales Invoice", 10, y);
  y += 10;
  doc.text(`Date: ${sale.date}`, 10, y);
  y += 10;

  sale.items.forEach(i => {
    doc.text(
      `${i.name} (${i.category}) - ${i.quantity} x ${i.sellingPrice}`,
      10,
      y
    );
    y += 8;
  });

  y += 10;
  doc.text(`Total Sale: PKR ${sale.totalSale}`, 10, y);
  y += 8;
  doc.text(`Profit: PKR ${sale.profit}`, 10, y);

  doc.save(`invoice-${sale.date}.pdf`);
};
