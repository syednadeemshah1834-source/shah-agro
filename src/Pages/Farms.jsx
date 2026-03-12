import React, { useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./Farms.css";

const Farms = () => {
  const [farms, setFarms] = useState([
    { id: 1, name: "Farm A", location: "Lahore", crops: 12 },
    { id: 2, name: "Farm B", location: "Multan", crops: 5 },
    { id: 3, name: "Farm C", location: "Faisalabad", crops: 20 },
  ]);

  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", crops: "" });

  // ===== Add or Update Farm =====
  const handleAddOrUpdate = () => {
    if (!formData.name || !formData.location || formData.crops === "") {
      alert("Please fill all fields");
      return;
    }

    const newFarm = {
      ...formData,
      id: editIndex !== null ? farms[editIndex].id : Date.now(),
      crops: parseInt(formData.crops)
    };

    if (editIndex !== null) {
      const updatedFarms = [...farms];
      updatedFarms[editIndex] = newFarm;
      setFarms(updatedFarms);
      setEditIndex(null);
    } else {
      setFarms([...farms, newFarm]);
    }

    setFormData({ name: "", location: "", crops: "" });
  };

  // ===== Edit / Delete =====
  const handleEdit = (index) => {
    const farm = farms[index];
    setFormData({ name: farm.name, location: farm.location, crops: farm.crops });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure to delete this farm?")) {
      const updatedFarms = [...farms];
      updatedFarms.splice(index, 1);
      setFarms(updatedFarms);
    }
  };

  // ===== Total Crops =====
  const totalCrops = farms.reduce((acc, farm) => acc + farm.crops, 0);

  // ===== Open Google Maps for farm location =====
  const openMap = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="page-container">
      <h1>Farms</h1>

      {/* ===== Crop Distribution Chart ===== */}
      <div className="chart-container">
        <h3>Farm-wise Crop Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={farms} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="crops" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Farm Form ===== */}
      <div className="farm-form">
        <h3>{editIndex !== null ? "Edit Farm" : "Add New Farm"}</h3>
        <input 
          type="text" 
          placeholder="Farm Name" 
          value={formData.name} 
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
        />
        <input 
          type="text" 
          placeholder="Location" 
          value={formData.location} 
          onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
        />
        <input 
          type="number" 
          placeholder="Number of Crops" 
          value={formData.crops} 
          onChange={(e) => setFormData({ ...formData, crops: e.target.value })} 
        />
        <button onClick={handleAddOrUpdate}>
          {editIndex !== null ? "Update Farm" : "Add Farm"}
        </button>
      </div>

      {/* ===== Farms Table ===== */}
      {farms.length > 0 && (
        <div className="farm-table">
          <h3>Farm List</h3>
          <table>
            <thead>
              <tr>
                <th>Farm Name</th>
                <th>Location</th>
                <th>Number of Crops</th>
                <th>Map</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm, idx) => (
                <tr key={farm.id} style={{ color: farm.crops <= 5 ? "#ef4444" : "inherit" }}>
                  <td>{farm.name}</td>
                  <td>{farm.location}</td>
                  <td>{farm.crops}</td>
                  <td>
                    <FaMapMarkerAlt 
                      style={{ color: "#3b82f6", cursor: "pointer" }} 
                      onClick={() => openMap(farm.location)} 
                      title={`View ${farm.name} on map`} 
                    />
                  </td>
                  <td>
                    <button onClick={() => handleEdit(idx)}>Edit</button>
                    <button onClick={() => handleDelete(idx)}>Delete</button>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="2">Total Crops</td>
                <td colSpan="3">{totalCrops}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Farms;
