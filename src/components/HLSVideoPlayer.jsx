// src/components/HLSVideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader } from 'lucide-react';

export default function HLSVideoPlayer({ videoId, onError }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const hlsRef = useRef(null);

  // Fetch access token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const authToken = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/videos/token/${videoId.replace('/api/videos/hls/', '')}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Token fetch failed:', errorData);
          
          // Don't throw error for "not associated" - try to play anyway
          if (response.status === 404 || errorData.error?.includes('not associated')) {
            console.warn('Video not in course yet, attempting direct access...');
            return null; // Will trigger direct HLS access attempt
          }
          
          throw new Error(errorData.error || 'Failed to get video access token');
        }
        

        const data = await response.json();
        setToken(data.token);
        
        // Refresh token before it expires
        const refreshTime = (data.expiresIn - 60) * 1000; // Refresh 1 minute before expiry
        setTimeout(() => {
          fetchToken(); // Recursive call to refresh token
        }, refreshTime);

      } catch (err) {
        console.error('Token fetch error:', err);
        setError(err.message);
        if (onError) onError(err);
      }
    };

    if (videoId) {
      fetchToken();
    }
  }, [videoId, onError]);

  // Initialize HLS player
  useEffect(() => {
    if (!token || !videoRef.current) return;

    const video = videoRef.current;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const videoUrl = `${API_URL}/api/videos/hls/${videoId}/index.m3u8?token=${token}`;

    // Check if HLS is natively supported
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      setLoading(false);
    } else if (window.Hls && window.Hls.isSupported()) {
      // Use hls.js for browsers that don't support HLS natively
      const hls = new window.Hls({
        xhrSetup: (xhr) => {
          // Add token to segment requests
          xhr.withCredentials = false;
        }
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded');
        setLoading(false);
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error loading video');
              hls.startLoad();
              break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error');
              hls.recoverMediaError();
              break;
            default:
              setError('Fatal error loading video');
              hls.destroy();
              break;
          }
          if (onError) onError(new Error(data.details));
        }
      });

      hlsRef.current = hls;

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    } else {
      setError('HLS not supported in this browser');
      if (onError) onError(new Error('HLS not supported'));
    }
  }, [token, videoId, onError]);

  // Video event handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.mozRequestFullScreen) {
        videoRef.current.mozRequestFullScreen();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-8">
          <p className="text-red-400 mb-2">비디오를 로드할 수 없습니다</p>
          <p className="text-sm text-gray-400">{error}</p>
          {error.includes('not associated') && (
            <p className="text-xs text-gray-500 mt-2">
              이 비디오는 아직 코스에 연결되지 않았습니다.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (loading || !token) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="h-12 w-12 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-400">비디오 로딩 중...</p>
        </div>
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

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full mb-4 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleMuteToggle}
                className="text-white hover:text-primary-400 transition-colors"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Time */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-primary-400 transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}