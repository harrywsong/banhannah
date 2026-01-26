// frontend/src/components/VideoPlayer.jsx - HLS Video Player
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

export default function VideoPlayer({ videoId, onError }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (videoId) {
      initializeVideo();
    }
  }, [videoId]);

  const initializeVideo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get access token
      const response = await apiClient.post(`/videos/access/${videoId}`);
      setAccessToken(response.data.token);

      // Initialize video player
      if (videoRef.current) {
        const video = videoRef.current;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
        const streamUrl = `${apiUrl}/videos/stream/${videoId}/index.m3u8?token=${response.data.token}`;

        // Check if HLS is supported
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          // Use HLS.js for browsers that don't support HLS natively
          const hls = new window.Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          setError('Video playback is not supported in this browser');
          if (onError) onError('Unsupported browser');
        }
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load video');
      setLoading(false);
      if (onError) onError(err);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setMuted(newVolume === 0);
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

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-black aspect-video flex items-center justify-center rounded-lg">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full mb-2 cursor-pointer"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="hover:text-blue-400 transition"
            >
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="hover:text-blue-400 transition"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 cursor-pointer"
              />
            </div>

            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="hover:text-blue-400 transition">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="hover:text-blue-400 transition"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}