import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  // -----------------------------------------
  // HANDLE GOOGLE REDIRECT RESULT
  // -----------------------------------------
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;

        const user = result.user;

        const res = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/auth/google`,
          {
            name: user.displayName,
            email: user.email,
          }
        );

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        onLoginSuccess(res.data.user);
      })
      .catch((err) => console.error(err));
  }, []);

  // -----------------------------------------
  // START GOOGLE LOGIN (REDIRECT MODE)
  // -----------------------------------------
  const handleGoogleLogin = () => {
    signInWithRedirect(auth, googleProvider);
  };

  // -----------------------------------------
  // EMAIL/PASSWORD LOGIN
  // -----------------------------------------
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isSignup
        ? `${process.env.REACT_APP_BACKEND_URL}/auth/signup`
        : `${process.env.REACT_APP_BACKEND_URL}/auth/login`;

      const payload = isSignup
        ? { name, email, password }
        : { email, password };

      const res = await axios.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onLoginSuccess(res.data.user);
    } catch (err) {
      console.error(err);
      alert("Authentication failed. Check credentials.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>🎬 Freeflix</h1>
      <div style={styles.card}>
        <h2>{isSignup ? "Create Account" : "Login to Continue"}</h2>

        <form onSubmit={handleEmailAuth} style={styles.form}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.btn}>
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span
            onClick={() => setIsSignup(!isSignup)}
            style={styles.link}
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>

        <hr style={styles.hr} />

        <button
          onClick={handleGoogleLogin}
          style={styles.googleBtn}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    paddingTop: "4rem",
    color: "white",
    backgroundColor: "#000",
    minHeight: "100vh",
  },
  logo: {
    color: "#e50914",
    fontSize: "2.5rem",
    marginBottom: "2rem",
  },
  card: {
    background: "#111",
    display: "inline-block",
    padding: "2rem",
    borderRadius: "12px",
    width: "320px",
    boxShadow: "0 0 10px rgba(255,255,255,0.06)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #333",
    backgroundColor: "#222",
    color: "white",
  },
  btn: {
    backgroundColor: "#e50914",
    border: "none",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  toggle: { marginTop: "1rem" },
  link: {
    color: "#e50914",
    cursor: "pointer",
    fontWeight: "bold",
  },
  hr: { margin: "1.5rem 0", border: "0.5px solid #333" },
  googleBtn: {
    backgroundColor: "#4285F4",
    border: "none",
    color: "white",
    padding: "10px 15px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
