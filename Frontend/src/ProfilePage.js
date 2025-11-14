// src/ProfilePage.js
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ProfilePage({ backend, user, setUser }) {
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch fresh profile from backend if token exists
    (async () => {
      const token = localStorage.getItem("ff_token");
      if (!token) return;
      setLoading(true);
      try {
        const res = await axios.get(`${backend}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data.user);
        localStorage.setItem("ff_user", JSON.stringify(res.data.user));
        setUser(res.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, []);

  if (!profile) return <div style={{ padding: 16 }}>Not logged in. Please login to view profile.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Profile — {profile.name}</h2>
      <p>{profile.email}</p>

      <section style={{ marginTop: 20 }}>
        <h3>Liked movies</h3>
        {!profile.likedMovies || profile.likedMovies.length === 0 ? (
          <p>No liked movies yet.</p>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {profile.likedMovies.map((m) => (
              <div key={m.imdbID} style={{ width: 160, background: "#111", padding: 8, borderRadius: 8 }}>
                {m.poster ? <img src={m.poster} alt={m.title} style={{ width: "100%", height: 200, objectFit: "cover" }} /> : null}
                <div style={{ fontWeight: 700, marginTop: 8 }}>{m.title}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Watch history</h3>
        {!profile.watchedMovies || profile.watchedMovies.length === 0 ? (
          <p>No watch history yet.</p>
        ) : (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {profile.watchedMovies.map((m) => (
              <div key={m.imdbID + m.watchedAt} style={{ width: 160, background: "#111", padding: 8, borderRadius: 8 }}>
                {m.poster ? <img src={m.poster} alt={m.title} style={{ width: "100%", height: 200, objectFit: "cover" }} /> : null}
                <div style={{ fontWeight: 700, marginTop: 8 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{new Date(m.watchedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
