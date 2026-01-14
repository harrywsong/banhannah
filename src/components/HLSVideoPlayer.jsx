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
  const [retryCount, setRetryCount] = useState(0);
  const [accessInfo, setAccessInfo] = useState(null); // NEW: Store access information
  const [showAccessWarning, setShowAccessWarning] = useState(false); // NEW: Show expiration warning
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const MAX_RETRIES = 5;

/* ---------------- TOKEN FETCH ---------------- */

useEffect(() => {
  console.log('🎬 HLSVideoPlayer mounted/updated:', {
    videoId,
    hasVideoRef: !!videoRef.current,
    apiUrl: API_URL
  });
  
  if (!videoId) {
    console.log('❌ No videoId provided, returning');
    return;
  }

  let cancelled = false;

  const fetchToken = async () => {
    console.log('🔑 Fetching token for videoId:', videoId);
      try {
        const authToken = localStorage.getItem('token');
        console.log('🔑 Auth token:', authToken ? 'Found' : 'Not found');


        console.log('📡 Making token request to:', `${API_URL}/api/videos/token/${videoId}`);
        
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
          console.error('❌ Token request failed:', {
            status: response.status,
            error: err
          });

          if (!cancelled) {
            setError(err.error || 'Failed to get video access token');
            setLoading(false);
          }

          throw new Error(err.error || 'Token request failed');
        }

        const data = await response.json();
        console.log('✅ Token response:', {
          success: data.success,
          hasToken: !!data.token,
          access: data.access,
          expiresIn: data.expiresIn
        });
        
        if (cancelled) return;

        setToken(data.token);
        console.log('💾 Token saved to state');
        
        // Store access information
        if (data.access) {
          setAccessInfo(data.access);
          
          // Show warning if access is expiring soon
          if (data.access.isExpiringSoon) {
            setShowAccessWarning(true);
            // Auto-hide warning after 10 seconds
            setTimeout(() => setShowAccessWarning(false), 10000);
          }
        }

        // refresh 60s before expiry
        const refreshTime = Math.max((data.expiresIn - 60) * 1000, 0);

        refreshTimerRef.current = setTimeout(fetchToken, refreshTime);
      } catch (err) {
        console.error('❌ Token fetch exception:', err);
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
  console.log('🎞️ HLS Init useEffect triggered:', {
    hasToken: !!token,
    hasVideoRef: !!videoRef.current,
    videoId
  });
  
  if (!token || !videoRef.current) {
    console.log('⏸️ HLS Init skipped - missing token or videoRef');
    return;
  }

  const video = videoRef.current;
  console.log('🎬 Starting HLS initialization for videoId:', videoId);
    
    // First check if video conversion is complete
    const checkStatus = async () => {
      try {
        const statusResponse = await fetch(`${API_URL}/api/videos/hls/${videoId}/status?token=${token}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.status === 'processing') {
            setError('비디오 변환 중입니다. 잠시만 기다려주세요...');
            setLoading(false);
            
            // Auto-retry after 5 seconds if not exceeded max retries
            if (retryCount < MAX_RETRIES) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, 5000);
            } else {
              setError('비디오 변환이 예상보다 오래 걸리고 있습니다. 나중에 다시 시도해주세요.');
            }
            return false;
          } else if (statusData.status === 'failed') {
            setError('비디오 변환에 실패했습니다.');
            setLoading(false);
            return false;
          }
        }
        return true;
      } catch (err) {
        console.log('Status check failed, proceeding anyway:', err);
        return true; // Proceed if status check fails
      }
    };
  
    checkStatus().then(canProceed => {
      if (!canProceed) return;
      
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

// src/components/HLSVideoPlayer.jsx

  if (Hls.isSupported()) {
      console.log('🔧 Using HLS.js for video playback');
      
      const hls = new Hls({
        debug: true, // Enable debugging to see what's happening
        xhrSetup: function (xhr, url) {
          console.log(`📡 HLS.js requesting: ${url}`);
          xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
          
          // CRITICAL: Pass token in Authorization header for all requests
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        },
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hlsRef.current = hls;

      const videoUrl = `${API_URL}/api/videos/hls/${videoId}/index.m3u8?token=${token}`;
      
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
    const isProcessing = error.includes('변환 중');
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white p-8">
          <p className={`${isProcessing ? 'text-yellow-400' : 'text-red-400'} mb-2`}>
            {isProcessing ? '비디오 처리 중' : '비디오를 로드할 수 없습니다'}
          </p>
          <p className="text-sm text-gray-400">{error}</p>
          {isProcessing && (
            <div className="mt-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-xs text-gray-400 mt-2">비디오가 곧 준비됩니다</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      {/* Access Warning Banner */}
      {showAccessWarning && accessInfo?.isExpiringSoon && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-white px-4 py-2 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Your course access expires in {accessInfo.remainingDays} day{accessInfo.remainingDays !== 1 ? 's' : ''}
            </span>
          </div>
          <button 
            onClick={() => setShowAccessWarning(false)}
            className="text-white hover:text-yellow-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Loading Spinner Overlay */}
      {(loading || !token) && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <Loader className="h-12 w-12 animate-spin text-white" />
          <p className="text-white ml-4">Loading video...</p>
        </div>
      )}
      
      {/* Video Element - Always rendered */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controlsList="nodownload"
        disablePictureInPicture={false}
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
      />

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
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


  })}