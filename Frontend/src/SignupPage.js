// src/SignupPage.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SignupPage({ backend, setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await axios.post(`${backend}/auth/signup`, { name, email, password });
      const { token, user } = res.data;
      localStorage.setItem("ff_token", token);
      localStorage.setItem("ff_user", JSON.stringify(user));
      setUser(user);
      navigate("/");
    } catch (error) {
      setErr(error.response?.data?.error || "Signup failed");
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Sign up</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, width: 360 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" type="submit">Create account</button>
        {err && <div style={{ color: "salmon" }}>{err}</div>}
      </form>
    </div>
  );
}
