"use client";

import { useState } from "react";

function extractYoutubeId(raw: string): string | null {
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
      if (
        embedIdx >= 0 &&
        parts[embedIdx + 1] &&
        /^[\w-]{11}$/.test(parts[embedIdx + 1]!)
      ) {
        return parts[embedIdx + 1]!;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function YoutubePreview({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [playing, setPlaying] = useState(false);
  const youtubeId = extractYoutubeId(url);

  if (!youtubeId) return null;

  return (
    <figure className="use-case-video">
      <figcaption className="use-case-video-title">{title}</figcaption>
      <div className="use-case-video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            className="use-case-video-poster"
            onClick={() => setPlaying(true)}
            aria-label={`Play: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              className="use-case-video-poster-image"
            />
            <span className="use-case-video-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M7.2 5.2v13.6L19 12 7.2 5.2Z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <a
        className="use-case-video-link"
        href={`https://youtu.be/${youtubeId}`}
        target="_blank"
        rel="noreferrer"
      >
        Open on YouTube
      </a>
    </figure>
  );
}
