import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import "./Fertilizers.css";

const Fertilizers = () => {
  const shopId = "mainshop";

  const [fertilizers, setFertilizers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    rate: "",
    supplier: "",
    expiry: "",
  });

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fertRef = collection(db, "shops", shopId, "fertilizers");
    const salesRef = collection(db, "shops", shopId, "sales");

    const unsubFert = onSnapshot(fertRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFertilizers(list);
      setLoading(false);
    });

    const unsubSales = onSnapshot(salesRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSales(list);
    });

    return () => {
      unsubFert();
      unsubSales();
    };
  }, []);

  /* ================= LIVE STOCK ================= */

  const liveStock = useMemo(() => {
    const map = {};

    fertilizers.forEach((item) => {
      map[item.name] = (map[item.name] || 0) + Number(item.quantity);
    });

    sales.forEach((sale) => {
      map[sale.itemName] =
        (map[sale.itemName] || 0) - Number(sale.quantity);
    });

    return map;
  }, [fertilizers, sales]);

  /* ================= TOTAL VALUE PER ITEM ================= */

  const itemValue = (name, rate) => {
    const stock = liveStock[name] || 0;
    return stock * rate;
  };

  /* ================= GRAND TOTAL ================= */

  const grandTotalValue = useMemo(() => {
    return fertilizers.reduce((total, item) => {
      return total + itemValue(item.name, item.rate);
    }, 0);
  }, [fertilizers, liveStock]);

  /* ================= SEARCH ================= */

  const filtered = fertilizers.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.quantity || !formData.rate) {
      alert("Please fill required fields");
      return;
    }

    if (editingItem) {
      await updateDoc(
        doc(db, "shops", shopId, "fertilizers", editingItem.id),
        {
          name: formData.name,
          quantity: Number(formData.quantity),
          rate: Number(formData.rate),
          supplier: formData.supplier,
          expiry: formData.expiry,
        }
      );
    } else {
      await addDoc(collection(db, "shops", shopId, "fertilizers"), {
        name: formData.name,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        supplier: formData.supplier,
        expiry: formData.expiry,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (window.confirm("Delete this fertilizer?")) {
      await deleteDoc(doc(db, "shops", shopId, "fertilizers", id));
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (item) => {
    setEditingItem(item);

    setFormData({
      name: item.name,
      quantity: item.quantity,
      rate: item.rate,
      supplier: item.supplier,
      expiry: item.expiry,
    });

    setShowModal(true);
  };

  /* ================= RESET ================= */

  const resetForm = () => {
    setShowModal(false);
    setEditingItem(null);

    setFormData({
      name: "",
      quantity: "",
      rate: "",
      supplier: "",
      expiry: "",
    });
  };

  /* ================= UI ================= */

  return (
    <div className="fertilizer-page">

      {/* HEADER */}

      <div className="page-header">

        <h2>Fertilizers Inventory</h2>

        <button
          className="add-btn"
          onClick={() => setShowModal(true)}
        >
          + Add Fertilizer
        </button>

      </div>

      {/* SEARCH */}

      <input
        className="search-input"
        placeholder="Search fertilizer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* TABLE */}

      <div className="table-wrapper">

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="fertilizer-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Stock</th>
                <th>Rate</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map((item) => {

                const stock = liveStock[item.name] || 0;
                const totalValue = itemValue(item.name, item.rate);

                return (
                  <tr key={item.id}>

                    <td>{item.name}</td>

                    <td className="stock">
                      {stock}
                    </td>

                    <td>
                      Rs {item.rate}
                    </td>

                    <td className="value">
                      Rs {totalValue.toLocaleString()}
                    </td>

                    <td>
                      {item.supplier}
                    </td>

                    <td>
                      {item.expiry}
                    </td>

                    <td className="actions">

                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                );
              })}

            </tbody>

            {/* FOOTER TOTAL */}

            <tfoot>

              <tr className="grand-total-row">

                <td colSpan="3">
                  GRAND TOTAL INVENTORY VALUE
                </td>

                <td>
                  Rs {grandTotalValue.toLocaleString()}
                </td>

                <td colSpan="3"></td>

              </tr>

            </tfoot>

          </table>
        )}

      </div>

      {/* MODAL */}

      {showModal && (
        <div className="modal-overlay">

          <div className="modal">

            <h3>
              {editingItem
                ? "Edit Fertilizer"
                : "Add Fertilizer"}
            </h3>

            <form onSubmit={handleSubmit}>

              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Rate"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: e.target.value,
                  })
                }
              />

              <input
                placeholder="Supplier"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    supplier: e.target.value,
                  })
                }
              />

              <input
                type="date"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expiry: e.target.value,
                  })
                }
              />

              <div className="modal-buttons">

                <button type="submit" className="save-btn">
                  Save
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Fertilizers;
