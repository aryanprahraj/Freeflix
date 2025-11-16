// Frontend/src/LoginPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    console.log("[LoginPage] useEffect: checking redirect result...");
    getRedirectResult(auth)
      .then(async (result) => {
        console.log("[LoginPage] getRedirectResult -> result:", result);
        if (!result) {
          console.log("[LoginPage] No redirect result (user not returned).");
          return;
        }

        try {
          const user = result.user;
          console.log("[LoginPage] Redirect user:", {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
          });

          const res = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/auth/google`,
            { name: user.displayName, email: user.email },
            { timeout: 10000 }
          );

          console.log("[LoginPage] backend /auth/google response:", res.data);
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          onLoginSuccess(res.data.user);
        } catch (err) {
          console.error("[LoginPage] Error while sending backend request:", err);
          alert("Login succeeded with Google but backend request failed. Check console.");
        }
      })
      .catch((err) => {
        console.error("[LoginPage] getRedirectResult error:", err);
        alert("getRedirectResult error — check console.");
      });
  }, [onLoginSuccess]);

  const handleGoogleLogin = () => {
    console.log("[LoginPage] handleGoogleLogin: starting signInWithRedirect");
    signInWithRedirect(auth, googleProvider);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup
        ? `${process.env.REACT_APP_BACKEND_URL}/auth/signup`
        : `${process.env.REACT_APP_BACKEND_URL}/auth/login`;

      const payload = isSignup ? { name, email, password } : { email, password };
      const res = await axios.post(endpoint, payload, { timeout: 10000 });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      console.error("[LoginPage] Email auth error:", err);
      alert("Authentication failed. Check console.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>🎬 Freeflix</h1>
      <div style={styles.card}>
        <h2>{isSignup ? "Create Account" : "Login to Continue"}</h2>

        <form onSubmit={handleEmailAuth} style={styles.form}>
          {isSignup && (
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
          )}

          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

          <button type="submit" style={styles.btn}>{isSignup ? "Sign Up" : "Login"}</button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)} style={styles.link}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>

        <hr style={styles.hr} />
        <button onClick={handleGoogleLogin} style={styles.googleBtn}>Sign in with Google</button>
      </div>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", paddingTop: "4rem", color: "white", backgroundColor: "#000", minHeight: "100vh" },
  logo: { color: "#e50914", fontSize: "2.5rem", marginBottom: "2rem" },
  card: { background: "#111", display: "inline-block", padding: "2rem", borderRadius: "12px", width: "320px", boxShadow: "0 0 10px rgba(255,255,255,0.06)" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #333", backgroundColor: "#222", color: "white" },
  btn: { backgroundColor: "#e50914", border: "none", color: "white", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  toggle: { marginTop: "1rem" },
  link: { color: "#e50914", cursor: "pointer", fontWeight: "bold" },
  hr: { margin: "1.5rem 0", border: "0.5px solid #333" },
  googleBtn: { backgroundColor: "#4285F4", border: "none", color: "white", padding: "10px 15px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
};
