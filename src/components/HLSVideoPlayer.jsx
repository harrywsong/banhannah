// src/components/HLSVideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from 'lucide-react';
import Hls from 'hls.js';


export default function HLSVideoPlayer({ videoId, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  /* ---------------- TOKEN FETCH ---------------- */

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    const fetchToken = async () => {
      try {
        const authToken = localStorage.getItem('token');

        const response = await fetch(
          `${API_URL}/api/videos/token/${videoId}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));

          if (!cancelled) {
            setError(err.error || 'Failed to get video access token');
            setLoading(false);
          }

          throw new Error(err.error || 'Token request failed');
        }

        const data = await response.json();
        if (cancelled) return;

        setToken(data.token);

        // refresh 60s before expiry
        const refreshTime = Math.max((data.expiresIn - 60) * 1000, 0);

        refreshTimerRef.current = setTimeout(fetchToken, refreshTime);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
          onError?.(err);
        }
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [videoId, API_URL, onError]);

  /* ---------------- HLS INIT ---------------- */

  useEffect(() => {
    if (!token || !videoRef.current) return;

    const video = videoRef.current;
    const videoUrl = `${API_URL}/api/videos/hls/${videoId}/index.m3u8?token=${token}`;

    setLoading(true);
    setError(null);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Native HLS (Safari / iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;

      const onLoaded = () => setLoading(false);
      const onVideoError = () => {
        setLoading(false);
        setError('Failed to load video');
        onError?.(new Error('Native HLS failed'));
      };

      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onVideoError);

      return () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onVideoError);
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
    
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
      });
    
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
    
        if (data.fatal) {
          setLoading(false);
          setError('Video playback error');
          hls.destroy();
          hlsRef.current = null;
          onError?.(new Error(data.details || 'HLS fatal error'));
        }
      });
    
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
    

    setError('HLS not supported in this browser');
    setLoading(false);
    onError?.(new Error('HLS not supported'));
  }, [token, videoId, API_URL, onError]);

  /* ---------------- UI HANDLERS ---------------- */

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    if (videoRef.current) videoRef.current.currentTime = e.target.value;
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`;

  /* ---------------- RENDER ---------------- */

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-8">
          <p className="text-red-400 mb-2">비디오를 로드할 수 없습니다</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !token) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
      />

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-4 opacity-0 group-hover:opacity-100">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full mb-4"
        />

        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button onClick={handleMuteToggle}>
              {isMuted ? <VolumeX /> : <Volume2 />}
            </button>
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={handleFullscreen}>
            <Maximize />
          </button>
        </div>
      </div>
    </div>
  );
}
