"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MUSIC_PATH = "/assets/mixkit-finding-myself-993.mp3";
const MUSIC_PREFERENCE_KEY = "eikon-music-enabled";
const BACKGROUND_VOLUME = 0.25;
const MUSIC_TOGGLE_EVENT = "eikon-music-toggle";

function isProtectedPath(pathname: string | null) {
  return /^\/(?:en|ro)\/(?:client|admin)(?:\/|$)/.test(pathname ?? "");
}

function readMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_PREFERENCE_KEY) === "true";
  } catch {
    return false;
  }
}

function storeMusicPreference(enabled: boolean) {
  try {
    localStorage.setItem(MUSIC_PREFERENCE_KEY, String(enabled));
  } catch {
    // Playback should still work when browser storage is unavailable.
  }
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayAttemptedRef = useRef(false);
  const pathname = usePathname();
  const [, setPlaying] = useState(false);

  useEffect(() => {
    if (autoplayAttemptedRef.current) return;
    autoplayAttemptedRef.current = true;

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = BACKGROUND_VOLUME;
    if (!readMusicPreference()) {
      audio.pause();
      return;
    }

    let active = true;
    void audio.play().catch(() => {
      if (active) setPlaying(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      storeMusicPreference(false);
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      storeMusicPreference(true);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  useEffect(() => {
    const handleToggle = () => void toggle();
    window.addEventListener(MUSIC_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(MUSIC_TOGGLE_EVENT, handleToggle);
  });

  return (
    <>
      <audio
        ref={audioRef}
        data-testid="background-music"
        src={MUSIC_PATH}
        preload="none"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setPlaying(false)}
      />
      {!isProtectedPath(pathname) && <MusicToggleButton variant="floating" />}
    </>
  );
}

export function MusicToggleButton({ variant = "header" }: { variant?: "floating" | "header" }) {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const isRomanian = pathname === "/ro" || pathname?.startsWith("/ro/") || !pathname;
  const label = playing
    ? isRomanian
      ? "Oprește muzica"
      : "Turn music off"
    : isRomanian
      ? "Pornește muzica"
      : "Turn music on";

  useEffect(() => {
    const audio = document.querySelector<HTMLAudioElement>("[data-testid='background-music']");
    if (!audio) return;

    const sync = () => setPlaying(!audio.paused);
    sync();
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("error", sync);
    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("error", sync);
    };
  }, []);

  return (
    <button
      className={`music-toggle music-toggle--${variant}`}
      type="button"
      aria-label={label}
      aria-pressed={playing}
      title={label}
      onClick={() => window.dispatchEvent(new Event(MUSIC_TOGGLE_EVENT))}
    >
      <svg className="music-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
        {!playing && <path className="music-toggle__slash" d="M4 4l16 16" />}
      </svg>
    </button>
  );
}
