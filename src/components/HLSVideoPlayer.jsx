// src/components/HLSVideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader, AlertCircle } from 'lucide-react';
import Hls from 'hls.js';

export default function HLSVideoPlayer({ videoId, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const tokenRef = useRef(null); // Store token in ref for immediate access

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenState, setTokenState] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // ── Fetch streaming token ────────────────────────────────────────────────
  const fetchToken = async () => {
    if (!videoId) {
      setError('No video ID provided');
      setLoading(false);
      return null;
    }

    console.log(`🔑 Fetching token for video: ${videoId}`);
    
    try {
      // CRITICAL: Get auth token from localStorage
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch(`${API_URL}/api/videos/token/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        
        // Handle specific error codes
        if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        if (res.status === 403) {
          if (errData.code === 'NOT_PURCHASED') {
            throw new Error('Please purchase this course to access the video.');
          }
          if (errData.code === 'ACCESS_EXPIRED') {
            throw new Error('Your access to this course has expired. Please renew your subscription.');
          }
          throw new Error(errData.error || 'Access denied');
        }
        
        throw new Error(errData.error || `Token request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !data.token) {
        throw new Error('Invalid token response from server');
      }

      console.log('✅ Token received successfully');
      console.log('Token (first 40 chars):', data.token.substring(0, 40) + '...');
      console.log('Access info:', data.access);

      // Store token in both ref and state
      tokenRef.current = data.token;
      setTokenState(data.token);

      // Auto refresh before expiry
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      const refreshMs = Math.max((data.expiresIn - 60) * 1000, 30000);
      console.log(`⏰ Token refresh scheduled in ${Math.round(refreshMs / 1000)} seconds`);
      refreshTimerRef.current = setTimeout(fetchToken, refreshMs);

      return data.token;
    } catch (err) {
      console.error('❌ Token fetch error:', err.message);
      setError(err.message || 'Failed to obtain video access token');
      setLoading(false);
      if (onError) onError(err);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initToken = async () => {
      const token = await fetchToken();
      if (cancelled) return;
      
      if (!token) {
        setLoading(false);
      }
    };

    initToken();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [videoId]);

  // ── HLS Player Initialization ──────────────────────────────────────────
  useEffect(() => {
    const token = tokenRef.current || tokenState;
    
    if (!token || !videoRef.current) {
      console.log('⏳ HLS init waiting:', {
        hasToken: !!token,
        hasVideoRef: !!videoRef.current,
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

    console.log('🎬 Initializing HLS player');
    console.log('Video URL:', baseUrl);
    console.log('Using token:', token.substring(0, 40) + '...');

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
        // CRITICAL: Add authorization header to EVERY request
        xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      },
    });

    hlsRef.current = hls;

    hls.loadSource(baseUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ Manifest loaded - playback ready');
      setLoading(false);
      video.play().catch((e) => {
        console.log('ℹ️ Autoplay blocked (normal):', e.message);
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS error:', data);
      
      if (data.fatal) {
        let message = 'Video playback error';
        
        if (data.details === 'manifestLoadError') {
          message = 'Failed to load video. Please check your access permissions.';
        } else if (data.details === 'keyLoadError') {
          message = 'Failed to decrypt video. Your access may have expired.';
        }
        
        setLoading(false);
        setError(message);
        hls.destroy();
        if (onError) onError(new Error(data.details || 'Fatal HLS error'));
      }
    });

    return () => {
      console.log('🧹 Cleaning up HLS instance');
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [tokenState, videoId]);

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
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-semibold mb-2">Cannot play video</p>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
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