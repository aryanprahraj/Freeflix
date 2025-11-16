// src/App.js
import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import LoginPage from "./LoginPage";
const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("english");
  const [mood, setMood] = useState("action");
  const [mode, setMode] = useState("mood"); // mood | search | liked | watched
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 EDUCATIONAL REMOVED (ONLY CHANGE)
  const moods = ["action", "comedy", "romantic", "horror", "thriller"];

  // load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  // fetch mood movies
  const fetchMoodMovies = useCallback(async () => {
    setError("");
    setLoading(true);
    setMovies([]);
    try {
      const res = await fetch(
        `${BACKEND}/api/mood?mood=${encodeURIComponent(mood)}&lang=${encodeURIComponent(lang)}`
      );
      const data = await res.json();
      if (data?.movies && data.movies.length > 0) {
        setMovies(data.movies);
      } else {
        setMovies([]);
        setError("No movies found for this mood + language.");
      }
    } catch (err) {
      console.error("Mood fetch error:", err);
      setError("Failed to fetch mood movies.");
    } finally {
      setLoading(false);
    }
  }, [mood, lang]);

  // search
  const fetchSearch = useCallback(async () => {
    if (!query.trim()) return;
    setMode("search");
    setError("");
    setLoading(true);
    setMovies([]);
    try {
      const res = await fetch(
        `${BACKEND}/api/search?query=${encodeURIComponent(query)}&lang=${encodeURIComponent(lang)}`
      );
      const data = await res.json();
      if (data?.movies && data.movies.length > 0) {
        setMovies(data.movies);
      } else {
        setMovies([]);
        setError("No movies found for this search.");
      }
    } catch (err) {
      console.error("Search fetch error:", err);
      setError("Failed to fetch search results.");
    } finally {
      setLoading(false);
    }
  }, [query, lang]);

  // liked
  const fetchLiked = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view liked movies.");
      return;
    }
    setMode("liked");
    setError("");
    setLoading(true);
    setMovies([]);
    try {
      const res = await fetch(`${BACKEND}/user/liked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.likedMovies && data.likedMovies.length > 0) {
        setMovies(data.likedMovies);
      } else {
        setMovies([]);
        setError("No liked movies yet.");
      }
    } catch (err) {
      console.error("Fetch liked error:", err);
      setError("Failed to fetch liked movies.");
    } finally {
      setLoading(false);
    }
  }, []);

  // watched
  const fetchWatched = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to view watched movies.");
      return;
    }
    setMode("watched");
    setError("");
    setLoading(true);
    setMovies([]);
    try {
      const res = await fetch(`${BACKEND}/user/watched`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.watchedMovies && data.watchedMovies.length > 0) {
        setMovies(data.watchedMovies);
      } else {
        setMovies([]);
        setError("No watched history yet.");
      }
    } catch (err) {
      console.error("Fetch watched error:", err);
      setError("Failed to fetch watched movies.");
    } finally {
      setLoading(false);
    }
  }, []);

  // trigger mood fetch when mood/lang changes (only in mood mode)
  useEffect(() => {
    if (mode === "mood") fetchMoodMovies();
  }, [mode, mood, lang, fetchMoodMovies]);

  // initial auto-load
  useEffect(() => {
    setMode("mood");
    fetchMoodMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // like a movie
  const handleLike = async (movie) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/user/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movie }),
      });
      const data = await res.json();
      if (res.ok && data?.likedMovies) {
        alert(`❤️ ${movie.title} updated in likes`);
        if (mode === "liked") fetchLiked();
      } else {
        console.error("Like API response:", data);
        alert("Error liking movie.");
      }
    } catch (err) {
      console.error("Like error:", err);
      alert("Error liking movie.");
    }
  };

  // mark watched
  const handleWatch = async (movie) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      return;
    }
    try {
      const res = await fetch(`${BACKEND}/user/watch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movie }),
      });
      const data = await res.json();
      if (res.ok && data?.watchedMovies) {
        alert(`👀 ${movie.title} added to watched`);
        if (mode === "watched") fetchWatched();
      } else {
        console.error("Watch API response:", data);
        alert("Error marking watched.");
      }
    } catch (err) {
      console.error("Watch error:", err);
      alert("Error marking watched.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setMode("mood");
    setMovies([]);
    setError("");
    alert("Logged out");
  };

  const handleLangChange = (e) => {
    setLang(e.target.value);
    setMode("mood");
  };

  const handleMoodClick = (m) => {
    setMood(m);
    setMode("mood");
  };

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={(u, token) => {
          setUser(u);
          if (token) localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(u));
        }}
      />
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🎬 FreeFlix</h1>

        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim()) return;
            fetchSearch();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any movie..."
          />
          <button type="submit">🔍</button>
        </form>

        <div className="controls">
          <select value={lang} onChange={handleLangChange}>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>

          <div className="moods">
            {moods.map((m) => (
              <button
                key={m}
                className={m === mood && mode === "mood" ? "active" : ""}
                onClick={() => handleMoodClick(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
            <button style={{ marginLeft: 8 }} onClick={fetchLiked}>
              ❤️ Liked
            </button>
            <button onClick={fetchWatched}>👀 Watched</button>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={{ marginRight: 12 }}>
            Logged in as <b>{user.name}</b>
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
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
                  m.poster && m.poster.startsWith("http")
                    ? m.poster
                    : "https://i.postimg.cc/3Jw5pzzX/movie-poster-placeholder.png"
                }
                alt={m.title}
                onClick={() =>
                  window.open(
                    m.trailerSearch ||
                      `https://www.youtube.com/results?search_query=${encodeURIComponent(
                        (m.title || "") + " full movie"
                      )}`,
                    "_blank"
                  )
                }
              />
              <div className="info">
                <h3>{m.title}</h3>
                <p>{m.year}</p>
                <p className="plot">
                  {(m.plot || m.description || "").slice(0, 90)}
                  {(m.plot || m.description || "").length > 90 ? "..." : ""}
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => handleLike(m)}
                    style={{ padding: "6px 10px" }}
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleWatch(m)}
                    style={{ padding: "6px 10px" }}
                  >
                    👀
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
