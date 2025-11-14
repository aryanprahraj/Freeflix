// index.js — FreeFlix Backend (Educational mood removed cleanly)
// Everything else untouched.

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5050;
const OMDB_KEY = process.env.OMDB_KEY || "62ac3ef4";
const TMDB_KEY = process.env.TMDB_KEY || "";
const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/freeflix";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

/* ------------------ MongoDB ------------------ */
mongoose
  .connect(MONGO, { dbName: "freeflix" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error(err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  likedMovies: Array,
  watchedMovies: Array,
});
const User = mongoose.model("User", userSchema);

/* ------------------ Auth Middleware ------------------ */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/* ------------------ Signup ------------------ */
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email & password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || "User",
      email,
      password: hash,
      likedMovies: [],
      watchedMovies: [],
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch {
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ------------------ Login ------------------ */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ------------------ Google Login ------------------ */
app.post("/auth/google", async (req, res) => {
  try {
    const { name, email } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        password: null,
        likedMovies: [],
        watchedMovies: [],
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { ...user._doc, password: undefined } });
  } catch {
    res.status(500).json({ error: "Google login failed" });
  }
});

/* ------------------ Helper: Poster Fix ------------------ */
async function fixPoster(m) {
  if (m.poster_path) return `${TMDB_IMAGE_BASE}${m.poster_path}`;
  if (!TMDB_KEY) return "";

  try {
    const img = await fetch(
      `https://api.themoviedb.org/3/movie/${m.id}/images?api_key=${TMDB_KEY}`
    ).then((r) => r.json());

    if (img?.posters?.length > 0) {
      return `${TMDB_IMAGE_BASE}${img.posters[0].file_path}`;
    }
  } catch {}

  return "";
}

/* ------------------ SEARCH ------------------ */
app.get("/api/search", async (req, res) => {
  try {
    const query = (req.query.query || "").trim();
    if (!query) return res.json({ movies: [] });

    let movies = [];

    if (TMDB_KEY) {
      const tmdb = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
          query
        )}&include_adult=false&language=en-US`
      ).then((r) => r.json());

      if (tmdb?.results) {
        movies = await Promise.all(
          tmdb.results.slice(0, 18).map(async (m) => {
            let poster = await fixPoster(m);
            if (!poster)
              poster =
                "https://i.postimg.cc/3Jw5pzzX/movie-poster-placeholder.png";
            return {
              imdbID: String(m.id),
              title: m.title,
              year: m.release_date?.slice(0, 4),
              plot: m.overview,
              poster,
              source: "tmdb",
              trailerSearch: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                m.title + " full movie"
              )}`,
            };
          })
        );
      }
    }

    if (movies.length === 0) {
      const omdb = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_KEY}&s=${encodeURIComponent(
          query
        )}`
      ).then((r) => r.json());

      if (omdb?.Search) {
        movies = await Promise.all(
          omdb.Search.slice(0, 10).map(async (m) => {
            const full = await fetch(
              `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${m.imdbID}`
            ).then((r) => r.json());

            return {
              imdbID: full.imdbID,
              title: full.Title,
              year: full.Year,
              plot: full.Plot,
              poster:
                full.Poster && full.Poster !== "N/A"
                  ? full.Poster
                  : "https://i.postimg.cc/3Jw5pzzX/movie-poster-placeholder.png",
              source: "omdb",
              trailerSearch: `https://www.youtube.com/results?search_query=${encodeURIComponent(
                full.Title + " full movie"
              )}`,
            };
          })
        );
      }
    }

    res.json({ movies });
  } catch {
    res.status(500).json({ error: "Search failed" });
  }
});

/* ------------------ MOOD (Educational removed) ------------------ */
app.get("/api/mood", async (req, res) => {
  try {
    const mood = req.query.mood || "action";
    const lang = req.query.lang || "english";

    const genreMap = {
      action: [28, 12],
      comedy: [35],
      romantic: [10749],
      horror: [27],
      thriller: [53, 80],
    };

    const genres = genreMap[mood] || [18];
    const langCode = lang === "hindi" ? "hi" : "en";

    let url =
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}` +
      `&sort_by=popularity.desc&with_genres=${genres.join(",")}&page=1` +
      `&with_original_language=${langCode}`;

    let movies = [];

    const t = await fetch(url).then((r) => r.json());
    if (t?.results) {
      movies = t.results
        .filter((m) => m.poster_path)
        .slice(0, 18)
        .map((m) => ({
          imdbID: String(m.id),
          title: m.title,
          year: m.release_date?.slice(0, 4),
          plot: m.overview,
          poster: `${TMDB_IMAGE_BASE}${m.poster_path}`,
          source: "tmdb",
          trailerSearch: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            m.title + " full movie"
          )}`,
        }));
    }

    res.json({ mood, movies });
  } catch {
    res.status(500).json({ error: "Mood fetch failed" });
  }
});

/* ------------------ LIKE ------------------ */
app.post("/user/like", authMiddleware, async (req, res) => {
  try {
    const movie = req.body.movie;
    const user = await User.findById(req.userId);

    const exists = user.likedMovies.find((m) => m.imdbID === movie.imdbID);
    if (exists) {
      user.likedMovies = user.likedMovies.filter(
        (m) => m.imdbID !== movie.imdbID
      );
    } else {
      user.likedMovies.unshift(movie);
    }

    await user.save();
    res.json({ likedMovies: user.likedMovies });
  } catch {
    res.status(500).json({ error: "Could not save like" });
  }
});

/* ------------------ WATCH ------------------ */
app.post("/user/watch", authMiddleware, async (req, res) => {
  try {
    const movie = req.body.movie;
    const user = await User.findById(req.userId);

    user.watchedMovies.unshift(movie);
    await user.save();

    res.json({ watchedMovies: user.watchedMovies });
  } catch {
    res.status(500).json({ error: "Could not save watch history" });
  }
});

/* ------------------ FETCH Liked ------------------ */
app.get("/user/liked", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    res.json({ likedMovies: user.likedMovies || [] });
  } catch {
    res.status(500).json({ error: "Could not fetch liked movies" });
  }
});

/* ------------------ FETCH Watched ------------------ */
app.get("/user/watched", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    res.json({ watchedMovies: user.watchedMovies || [] });
  } catch {
    res.status(500).json({ error: "Could not fetch watched movies" });
  }
});

/* ------------------ ROOT ------------------ */
app.get("/", (req, res) => res.send("🎬 FreeFlix backend running!"));

app.listen(PORT, () =>
  console.log(`🚀 FreeFlix backend live at http://localhost:${PORT}`)
);
