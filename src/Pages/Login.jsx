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

        userDoc = {
          id: docRef.id,
          gmail,
          shopId: "mainshop",
          shopName: "Main Shop",
        };

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
      <div className="background-blur"></div>

      <div className="login-card">
        <h2 className="login-title">Main Shop Login</h2>

        <form onSubmit={handleLogin} className="login-form">

          <div className="input-group">
            <input
              type="email"
              required
              placeholder=" "
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
            />
            <label>Enter Gmail</label>
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Enter Password</label>

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;
