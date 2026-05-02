import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const logActivity = async (action, category, details) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const shopId = user?.shopId || "mainshop";
    const userName = user?.name || "Admin";

    await addDoc(collection(db, "shops", shopId, "logs"), {
      userName,
      action,      // e.g., "Added", "Updated", "Deleted"
      category,    // e.g., "Sales", "Purchases", "Inventory"
      details,     // e.g., "Sold 5x Urea to John"
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export const logError = async (errorMessage, componentInfo = "Global") => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const shopId = user?.shopId || "mainshop";
    const userName = user?.name || "System";

    await addDoc(collection(db, "shops", shopId, "logs"), {
      userName,
      action: "Error",
      category: "System Error",
      details: `${componentInfo}: ${errorMessage}`,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log error to database:", err);
  }
};
