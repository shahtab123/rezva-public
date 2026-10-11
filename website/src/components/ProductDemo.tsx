"use client";

import { useState } from "react";

function extractYoutubeId(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1] && /^[\w-]{11}$/.test(parts[embedIdx + 1]!)) {
        return parts[embedIdx + 1]!;
      }
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1] && /^[\w-]{11}$/.test(parts[shortsIdx + 1]!)) {
        return parts[shortsIdx + 1]!;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function ProductDemo() {
  const [playing, setPlaying] = useState(false);
  const youtubeId = extractYoutubeId("https://youtu.be/zhbiL9q0wGo");

  return (
    <div className="demo-wrap" aria-label="Product demo">
      <div className="demo-header">
        <span>
          <i /> Product demo
        </span>
        <span>{youtubeId ? "YouTube" : "Coming soon"}</span>
      </div>
      <div className="demo-screen">
        {youtubeId ? (
          <div className="demo-video-frame">
            {playing ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=1`}
                title="Rezva product demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <button
                type="button"
                className="demo-video-poster"
                onClick={() => setPlaying(true)}
                aria-label="Play product demo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`}
                  alt=""
                  className="demo-video-poster-image"
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.src.includes("maxresdefault")) {
                      img.src = `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`;
                    } else if (img.src.includes("sddefault")) {
                      img.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
                    }
                  }}
                />
                <span className="demo-play-btn" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                    <path d="M7.2 5.2v13.6L19 12 7.2 5.2Z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="demo-video-placeholder">
            <p>Product demo video</p>
            <span>Demo video is unavailable.</span>
          </div>
        )}
      </div>
    </div>
  );
}
