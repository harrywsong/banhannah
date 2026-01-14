// src/components/HLSVideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from 'lucide-react';
import Hls from 'hls.js';

export default function HLSVideoPlayer({ videoId, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for better autoplay compatibility
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ── Fetch streaming token ────────────────────────────────────────────────
  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    const fetchToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) throw new Error('No authentication token found');

        const res = await fetch(`${API_URL}/api/videos/token/${videoId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Token request failed (${res.status})`);
        }

        const data = await res.json();
        if (!data.success || !data.token) {
          throw new Error('Invalid token response');
        }

        if (cancelled) return;

        console.log('Token received (first 40 chars):', data.token.substring(0, 40) + '...');
        setToken(data.token);

        // Auto refresh ~60 seconds before expiry
        const refreshMs = Math.max((data.expiresIn - 60) * 1000, 30000);
        console.log(`Token refresh scheduled in ~${Math.round(refreshMs / 1000 / 60)} minutes`);
        refreshTimerRef.current = setTimeout(fetchToken, refreshMs);
      } catch (err) {
        console.error('Token fetch failed:', err);
        setError(err.message || 'Failed to obtain video access token');
        setLoading(false);
        onError?.(err);
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [videoId, API_URL, onError]);

  // ── HLS Player Initialization ──────────────────────────────────────────
  useEffect(() => {
    if (!token || !videoRef.current || !videoReady) {
      console.log('HLS init waiting for:', {
        hasToken: !!token,
        hasVideoRef: !!videoRef.current,
        videoReady,
      });
      return;
    }

    const video = videoRef.current;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setLoading(true);
    setError(null);

    const baseUrl = `${API_URL}/api/videos/hls/${videoId}/index.m3u8`;

    console.log('→ Using hls.js with Authorization Bearer header');
    console.log('Loading HLS source:', baseUrl);

    if (!Hls.isSupported()) {
      setError('Your browser does not support HLS playback');
      setLoading(false);
      return;
    }

    const hls = new Hls({
      debug: import.meta.env.DEV,
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 60,
      xhrSetup(xhr) {
        xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      },
    });

    hlsRef.current = hls;

    hls.loadSource(baseUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('→ Manifest loaded successfully - playback ready');
      setLoading(false);
      video.play().catch((e) => console.log('Autoplay blocked:', e.message));
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);
      if (data.fatal) {
        let message = 'Video playback error';
        if (data.details === 'manifestLoadError') {
          message = 'Failed to load video playlist (check token / permissions)';
        }
        setLoading(false);
        setError(message);
        hls.destroy();
        onError?.(new Error(data.details || 'Fatal HLS error'));
      }
    });

    return () => {
      console.log('Cleaning up HLS instance');
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [token, videoId, videoReady, API_URL, onError]);

  // ── UI Controls ────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    const muted = !videoRef.current.muted;
    videoRef.current.muted = muted;
    setIsMuted(muted);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
    setVolume(v);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e) => {
    if (videoRef.current) videoRef.current.currentTime = +e.target.value;
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.().catch(() => {});
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-red-400 text-lg mb-3">Cannot play video</p>
          <p className="text-gray-300">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            (Check console for details - look for 401/403 errors)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={(el) => {
          videoRef.current = el;
          if (el && !videoReady) setVideoReady(true);
        }}
        className="w-full h-full object-contain"
        controlsList="nodownload"
        disablePictureInPicture={false}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        muted={isMuted}
        playsInline
      />

      {loading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-12 w-12 animate-spin text-white" />
            <p className="text-white text-sm">Preparing secure video stream...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          step="any"
          onChange={handleSeek}
          className="w-full mb-3 accent-white cursor-pointer"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-5">
            <button onClick={handlePlayPause}>
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <button onClick={handleMuteToggle}>
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-white"
            />

            <span className="text-sm tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button onClick={handleFullscreen}>
            <Maximize size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}