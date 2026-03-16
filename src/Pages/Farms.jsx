import React, { useState, useMemo } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList
} from "recharts";
import "./Farms.css";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-entry">
            <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }}></span>
            <span className="tooltip-name">Active Stocks:</span>
            <span className="tooltip-value">{entry.value} Units</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Farms = () => {
  const [farms, setFarms] = useState([
    { id: 1, name: "Farm Alpha", location: "Lahore", crops: 12 },
    { id: 2, name: "Farm Bravo", location: "Multan", crops: 18 },
    { id: 3, name: "Farm Charlie", location: "Faisalabad", crops: 25 },
    { id: 4, name: "Farm Delta", location: "Sialkot", crops: 8 },
  ]);

  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "", crops: "" });

  // ===== Average Calculation =====
  const avgCrops = useMemo(() => {
    return farms.length ? (farms.reduce((acc, f) => acc + f.crops, 0) / farms.length) : 0;
  }, [farms]);

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
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Farm Inventory & Distribution</h2>
        <div className="stats-mini">
          <div style={{ textAlign: "right" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: 600 }}>Total Cultivation: </span>
            <span style={{ fontWeight: 800, color: "var(--accent-secondary)", fontSize: "24px", letterSpacing: "-1px" }}>{totalCrops}U</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header-content">
          <h3>Categorical Stock Analysis</h3>
          <p>Distribution volume per farm unit vs regional average</p>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={farms} margin={{ top: 30, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.4)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--text-secondary)", fontSize: 12, fontWeight: 700 }} 
              dy={12}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "var(--text-secondary)", fontSize: 12, fontWeight: 700 }} 
              tickFormatter={(val) => `${val}U`}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(226, 232, 240, 0.2)' }}
            />
            <ReferenceLine 
              y={avgCrops} 
              stroke="var(--accent-secondary)" 
              strokeDasharray="4 4" 
              strokeOpacity={0.6}
              label={{ position: 'right', value: 'Avg', fill: 'var(--accent-secondary)', fontSize: 11, fontWeight: 800 }}
            />
            <Bar 
              dataKey="crops" 
              radius={[6, 6, 0, 0]} 
              barSize={40} 
              animationDuration={2000}
            >
              {farms.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList dataKey="crops" position="top" style={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 800 }} offset={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="farm-form-container">
        <h3>{editIndex !== null ? "Edit Farm Specifications" : "Register New Farm Unit"}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Farm Identifier</label>
            <input 
              className="form-input"
              type="text" 
              placeholder="e.g. South Orchards" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Geographical Location</label>
            <input 
              className="form-input"
              type="text" 
              placeholder="e.g. Lahore Region" 
              value={formData.location} 
              onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Quantity of Crops</label>
            <input 
              className="form-input"
              type="number" 
              placeholder="0" 
              value={formData.crops} 
              onChange={(e) => setFormData({ ...formData, crops: e.target.value })} 
            />
          </div>
          <button className="btn-add" onClick={handleAddOrUpdate}>
            {editIndex !== null ? "Update Selection" : "Register Farm"}
          </button>
        </div>
      </div>

      {farms.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Farm Identifier</th>
                <th>Location Details</th>
                <th>Cultivated Crops</th>
                <th>Geographic View</th>
                <th>Record Actions</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm, idx) => (
                <tr key={farm.id}>
                  <td style={{ fontWeight: 600 }}>{farm.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{farm.location}</td>
                  <td style={{ fontWeight: 700, color: farm.crops <= 5 ? "#ef4444" : "var(--accent-primary)" }}>
                    {farm.crops}
                  </td>
                  <td>
                    <FaMapMarkerAlt 
                      className="map-icon"
                      style={{ color: "var(--accent-secondary)", cursor: "pointer" }} 
                      onClick={() => openMap(farm.location)} 
                      title={`View ${farm.name} on map`} 
                    />
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="edit-btn" onClick={() => handleEdit(idx)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(idx)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="2" style={{ textAlign: "right", paddingRight: "32px", color: "var(--text-secondary)" }}>
                  Combined Cultivation:
                </td>
                <td colSpan="3" style={{ fontSize: "16px" }}>{totalCrops} Products</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default Farms;
