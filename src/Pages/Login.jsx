import React, { useState } from "react";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!gmail || !password) {
      alert("Enter gmail and password");
      return;
    }
    try {
      const q = query(collection(db, "users"), where("gmail", "==", gmail));
      const snapshot = await getDocs(q);
      let userDoc;
      if (snapshot.empty) {
        const docRef = await addDoc(collection(db, "users"), {
          gmail,
          password,
          shopId: "mainshop",
          shopName: "Main Shop",
          createdAt: new Date(),
        });
        userDoc = { id: docRef.id, gmail, shopId: "mainshop", shopName: "Main Shop" };
        alert("New User Created & Logged In ✅");
      } else {
        const existingUser = snapshot.docs[0].data();
        if (existingUser.password !== password) {
          alert("Wrong Password ❌");
          return;
        }
        userDoc = {
          id: snapshot.docs[0].id,
          gmail: existingUser.gmail,
          shopId: existingUser.shopId,
          shopName: existingUser.shopName,
        };
        alert("Login Successful ✅");
      }
      localStorage.setItem("user", JSON.stringify(userDoc));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-side-panel">
        <div className="brand-content">
          <div className="brand-logo">
            <div className="brand-logo-icon">🚜</div>
            Shah Agro
          </div>
          <h2>Advance Agriculture Management System</h2>
          <p>
            The comprehensive platform designed to empower agricultural business owners with 
            real-time insights, intelligent stock tracking, and financial control.
          </p>
          <div className="brand-stats">
            <div className="stat-item">
              <h4>100%</h4>
              <p>Reliable Data Analysis</p>
            </div>
            <div className="stat-item">
              <h4>24/7</h4>
              <p>Critical Smart Alerts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-main-panel">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Please enter your administrative credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Administrator Email</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="admin@shahagro.com"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Security Password</label>
              <div className="password-container">
                <input
                  className="form-input"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁"}
                </span>
              </div>
            </div>

            <button type="submit" className="login-btn">
              Sign In to Dashboard
            </button>
          </form>

          <p className="form-footer" style={{ fontSize: "11px", opacity: 0.6 }}>
            v1.5.0 (Ultimate Mobile Update) • Terms & Privacy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
