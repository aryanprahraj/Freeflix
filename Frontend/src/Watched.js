// src/Watched.js
import React, { useEffect, useState } from "react";

const BACKEND = "http://localhost:5050";

export default function Watched() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWatched();
  }, []);

  async function loadWatched() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in first.");
        return;
      }

      const res = await fetch(`${BACKEND}/user/watched`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data?.watchedMovies) setMovies(data.watchedMovies);
      else setError("Failed to fetch watched movies.");
    } catch (err) {
      setError("Failed to fetch watched movies.");
    }
  }

  return (
    <div className="app">
      <h2 style={{ textAlign: "center" }}>👀 Watched Movies</h2>

      {error && <div className="error">{error}</div>}

      <div className="movie-grid">
        {movies.map((m) => (
          <div className="movie-card" key={m.imdbID}>
            <img
              src={
                m.poster && m.poster.startsWith("http")
                  ? m.poster
                  : "https://via.placeholder.com/300x450?text=No+Poster"
              }
              alt={m.title}
              onClick={() => window.open(m.trailerSearch, "_blank")}
            />

            <div className="info">
              <h3>{m.title}</h3>
              <p>{m.year}</p>
              <p className="plot">{m.plot?.slice(0, 80)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
