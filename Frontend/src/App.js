// src/App.js
import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import LoginPage from "./LoginPage";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("english");
  const [mood, setMood] = useState("action");
  const [mode, setMode] = useState("mood");
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const moods = ["action", "comedy", "romantic", "horror", "thriller"];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchMoodMovies = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND}/api/mood?mood=${encodeURIComponent(mood)}&lang=${encodeURIComponent(lang)}`
      );
      const data = await res.json();

      if (data?.movies?.length) setMovies(data.movies);
      else setError("No movies found.");
    } catch {
      setError("Failed to fetch movies.");
    } finally {
      setLoading(false);
    }
  }, [mood, lang]);

  useEffect(() => {
    if (mode === "mood") fetchMoodMovies();
  }, [mode, mood, lang, fetchMoodMovies]);

  useEffect(() => {
    setMode("mood");
    fetchMoodMovies();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setUser(u);
          localStorage.setItem("user", JSON.stringify(u));
        }}
      />
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🎬 FreeFlix</h1>

        <div style={{ marginTop: 8 }}>
          Logged in as <b>{user.name}</b>
          <button onClick={handleLogout} style={{ marginLeft: 12 }}>
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">Loading movies...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="movie-grid">
          {movies.map((m) => (
            <div className="movie-card" key={m.imdbID}>
              <img
                src={
                  m.poster?.startsWith("http")
                    ? m.poster
                    : "https://i.postimg.cc/3Jw5pzzX/movie-poster-placeholder.png"
                }
                alt={m.title}
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + " trailer")}`
                  )
                }
              />
              <div className="info">
                <h3>{m.title}</h3>
                <p>{m.year}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
