'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, ChevronLeft, ChevronRight, Search, FileText, X, Download, Volume2, Eye, EyeOff, User, Bot, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

interface ActivityLogsTableProps {
  calls: any[];
}

interface PlayingCall {
  id: string;
  name: string;
  phone: string;
  recordingUrl: string;
  transcript?: string;
  outcome?: string;
  duration?: number;
}

// Parse transcript into conversation format
interface TranscriptMessage {
  role: 'agent' | 'user';
  content: string;
  words?: { word: string; start: number; end: number }[];
}

function parseTranscript(transcript: string | undefined): TranscriptMessage[] {
  if (!transcript) return [];
  
  // Debug log to see what we're getting
  console.log('📝 Transcript raw:', typeof transcript, transcript?.substring?.(0, 200));
  
  try {
    // Retell transcript format is an array of objects with role and content
    const parsed = typeof transcript === 'string' ? JSON.parse(transcript) : transcript;
    console.log('📝 Transcript parsed:', Array.isArray(parsed), parsed?.length);
    
    if (Array.isArray(parsed)) {
      return parsed.map((msg: any) => ({
        role: msg.role === 'agent' ? 'agent' : 'user',
        content: msg.content || msg.text || msg.message || '',
        words: msg.words || [],
      }));
    }
    
    // Handle object with transcript array inside
    if (parsed?.transcript && Array.isArray(parsed.transcript)) {
      return parsed.transcript.map((msg: any) => ({
        role: msg.role === 'agent' ? 'agent' : 'user',
        content: msg.content || msg.text || msg.message || '',
        words: msg.words || [],
      }));
    }
  } catch (e) {
    console.log('📝 Transcript parse error:', e);
    // If not JSON, try to display as plain text
    if (typeof transcript === 'string' && transcript.length > 0) {
      return [{ role: 'agent', content: transcript, words: [] }];
    }
  }
  return [];
}

// Get current speaker based on audio time
function getCurrentSpeaker(transcript: TranscriptMessage[], currentTime: number): 'agent' | 'user' | null {
  for (const msg of transcript) {
    if (msg.words && msg.words.length > 0) {
      const firstWord = msg.words[0];
      const lastWord = msg.words[msg.words.length - 1];
      if (currentTime >= firstWord.start && currentTime <= lastWord.end) {
        return msg.role;
      }
    }
  }
  return null;
}

// Waveform Visualizer Component - REAL Audio Reactive!
function WaveformVisualizer({ 
  isPlaying, 
  speaker,
  audioRef,
}: { 
  isPlaying: boolean; 
  speaker: 'agent' | 'user' | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}) {
  const [bars, setBars] = useState<number[]>(Array(64).fill(5));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);
  
  // Setup Web Audio API analyzer
  useEffect(() => {
    if (!audioRef.current || isConnectedRef.current) return;
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // Connect audio element to analyzer
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      sourceRef.current = source;
      isConnectedRef.current = true;
      
      console.log('🎵 Audio analyzer connected!');
    } catch (err) {
      console.log('Audio context error (may already be connected):', err);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef]);
  
  // Animation loop to read frequency data
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      setBars(Array(64).fill(5));
      return;
    }
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateBars = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Convert frequency data to bar heights (0-100)
      const newBars = Array.from(dataArray).map(value => {
        // value is 0-255, convert to percentage with minimum height
        const height = Math.max(5, (value / 255) * 100);
        return height;
      });
      
      setBars(newBars);
      animationRef.current = requestAnimationFrame(updateBars);
    };
    
    // Resume audio context if suspended (browsers require user interaction)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    updateBars();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  // Color based on speaker
  const getBarColor = (index: number, height: number) => {
    if (!isPlaying || height < 10) return 'bg-gray-700';
    if (speaker === 'agent') {
      // Purple/Blue gradient based on intensity
      if (height > 70) return 'bg-purple-400';
      if (height > 40) return 'bg-blue-500';
      return 'bg-indigo-600';
    } else if (speaker === 'user') {
      // Green gradient based on intensity
      if (height > 70) return 'bg-emerald-400';
      if (height > 40) return 'bg-green-500';
      return 'bg-teal-600';
    }
    return 'bg-gray-500';
  };
  
  // Calculate overall volume for glow intensity
  const avgVolume = bars.reduce((a, b) => a + b, 0) / bars.length;
  
  const getGlowColor = () => {
    if (!isPlaying) return 'transparent';
    if (speaker === 'agent') return `rgba(139, 92, 246, ${0.3 + avgVolume / 200})`; // Purple glow
    if (speaker === 'user') return `rgba(52, 211, 153, ${0.3 + avgVolume / 200})`; // Green glow
    return 'transparent';
  };

  return (
    <div className="relative flex items-center justify-center h-72 w-full">
      {/* Glow backdrop - intensity based on volume */}
      <div 
        className="absolute inset-0 rounded-3xl blur-3xl transition-all duration-150"
        style={{ 
          backgroundColor: getGlowColor(),
          opacity: isPlaying ? Math.min(0.8, 0.3 + avgVolume / 150) : 0,
          transform: `scale(${1 + avgVolume / 500})`,
        }}
      />
      
      {/* Waveform bars */}
      <div className="relative flex items-end justify-center gap-[3px] h-full w-full px-4 pb-16">
        {bars.map((height, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-[50ms] ${getBarColor(i, height)}`}
            style={{
              height: `${height}%`,
              width: '6px',
              opacity: isPlaying ? 0.95 : 0.3,
              boxShadow: isPlaying && height > 20 
                ? `0 0 ${height / 5}px ${speaker === 'agent' ? 'rgba(139, 92, 246, 0.8)' : speaker === 'user' ? 'rgba(52, 211, 153, 0.8)' : 'transparent'}` 
                : 'none',
              transform: `scaleY(${isPlaying ? 1 : 0.3})`,
            }}
          />
        ))}
      </div>
      
      {/* Speaker label */}
      {isPlaying && speaker && (
        <div 
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-lg transition-all duration-150 ${
            speaker === 'agent' 
              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
              : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
          }`}
          style={{
            transform: `translateX(-50%) scale(${1 + avgVolume / 400})`,
            boxShadow: `0 0 ${avgVolume / 3}px ${speaker === 'agent' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(52, 211, 153, 0.5)'}`,
          }}
        >
          {speaker === 'agent' ? '🤖 AI Speaking' : '👤 Customer Speaking'}
        </div>
      )}
      
      {/* Volume meter */}
      {isPlaying && (
        <div className="absolute top-4 right-4 text-xs text-gray-400 font-mono">
          VOL: {Math.round(avgVolume)}%
        </div>
      )}
    </div>
  );
}

// Expanded TikTok-style Player Modal with Waveform
function ExpandedPlayerModal({
  playingCall,
  audioRef,
  currentTime,
  duration,
  isPlaying,
  isLoading,
  onPlayPause,
  onSeek,
  onClose,
  formatTime,
  onSpeedChange,
  playbackSpeed,
}: {
  playingCall: PlayingCall;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  formatTime: (seconds: number) => string;
  onSpeedChange: () => void;
  playbackSpeed: number;
}) {
  const [phoneHidden, setPhoneHidden] = useState(false);
  const transcript = parseTranscript(playingCall.transcript);
  
  // Determine who's currently speaking based on time
  const currentSpeaker = getCurrentSpeaker(transcript, currentTime);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Hide last 7 digits of phone number with blur
  const getDisplayPhone = () => {
    if (!phoneHidden) return playingCall.phone;
    const digits = playingCall.phone.replace(/\D/g, '');
    if (digits.length >= 7) {
      return playingCall.phone.slice(0, -7) + '•••••••';
    }
    return '•••••••••••';
  };
  
  // Speed display text
  const getSpeedText = () => {
    if (playbackSpeed === 1) return '1x';
    return `${playbackSpeed}x`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-16 lg:p-24 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-4xl h-full max-h-[600px] bg-gradient-to-br from-[#0B1437] via-[#1A2647] to-[#0B1437] rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentSpeaker === 'agent' 
                ? 'bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/50' 
                : currentSpeaker === 'user'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/50'
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
            }`}>
              <Volume2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{playingCall.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-gray-400 font-mono text-sm transition-all ${phoneHidden ? 'blur-sm select-none' : ''}`}>
                  {getDisplayPhone()}
                </span>
                <button
                  onClick={() => setPhoneHidden(!phoneHidden)}
                  className="p-1.5 rounded-lg hover:bg-gray-700/50 transition-colors"
                  title={phoneHidden ? 'Show number' : 'Hide number'}
                >
                  {phoneHidden ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content - Big Waveform */}
        <div className="flex-1 flex items-center justify-center p-8">
          <WaveformVisualizer 
            isPlaying={isPlaying} 
            speaker={currentSpeaker}
            audioRef={audioRef}
          />
        </div>

        {/* Player Controls (Bottom) */}
        <div className="p-6 border-t border-gray-800/50 bg-[#0B1437]/50">
          <div className="flex items-center gap-6">
            {/* Play/Pause Button */}
            <button
              onClick={onPlayPause}
              disabled={isLoading}
              className={`flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full transition-all ${
                isLoading 
                  ? 'bg-gray-600 cursor-wait' 
                  : isPlaying 
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/30' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/30'
              } text-white`}
            >
              {isLoading ? (
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </button>

            {/* Progress */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 font-mono w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative h-2 bg-gray-700 rounded-full overflow-hidden group">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={onSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {/* Hover indicator */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                </div>
                <span className="text-sm text-gray-400 font-mono w-12">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Speed Control */}
            <button
              onClick={onSpeedChange}
              className="flex-shrink-0 flex items-center justify-center min-w-[56px] h-12 px-3 rounded-full bg-gray-700/50 hover:bg-purple-500/30 text-gray-300 hover:text-purple-300 transition-all font-bold text-sm border border-transparent hover:border-purple-500/50"
              title="Change playback speed"
            >
              {getSpeedText()}
            </button>

            {/* Download */}
            <a
              href={`/api/recordings/stream?url=${encodeURIComponent(playingCall.recordingUrl)}`}
              download={`recording-${playingCall.id}.mp3`}
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white transition-all"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Audio Player Component
function FloatingAudioPlayer({ 
  playingCall,
  onClose 
}: { 
  playingCall: PlayingCall;
  onClose: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Speed options: 1x -> 1.25x -> 1.5x -> 2x -> 1x
  const SPEED_OPTIONS = [1, 1.25, 1.5, 2];
  
  const handleSpeedChange = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Create proxied URL
  const proxyUrl = `/api/recordings/stream?url=${encodeURIComponent(playingCall.recordingUrl)}`;

  // Auto-play when mounted
  useEffect(() => {
    if (audioRef.current) {
      setIsLoading(true);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch((err) => {
        console.error('Autoplay failed:', err);
        setIsLoading(false);
      });
    }
  }, [playingCall.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
    setIsLoading(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleEnded = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Handle pill click to expand
  const handlePillClick = () => {
    setIsExpanded(true);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={proxyUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Expanded Modal */}
      {isExpanded && (
        <ExpandedPlayerModal
          playingCall={playingCall}
          audioRef={audioRef}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onClose={() => setIsExpanded(false)}
          formatTime={formatTime}
          onSpeedChange={handleSpeedChange}
          playbackSpeed={playbackSpeed}
        />
      )}

      {/* Floating Pill Player */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
        {/* Pill Player - with smooth hover/press animations using CSS */}
        <div 
          className="pill-player bg-gradient-to-r from-[#1A2647] to-[#0B1437] border border-blue-500/30 rounded-full px-4 py-3 shadow-2xl shadow-blue-500/20 flex items-center gap-4 min-w-[400px] max-w-[500px] cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => { setIsPressed(false); handlePillClick(); }}
          style={{
            transform: isPressed ? 'scale(0.97)' : isHovered ? 'scale(1.03)' : 'scale(1)',
            boxShadow: isHovered 
              ? '0 25px 50px -12px rgba(59, 130, 246, 0.4)' 
              : '0 25px 50px -12px rgba(59, 130, 246, 0.2)',
            borderColor: isHovered ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.3)',
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 300ms ease, border-color 300ms ease',
          }}
        >
          {/* Play/Pause Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
            disabled={isLoading}
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              isLoading 
                ? 'bg-gray-600 cursor-wait' 
                : isPlaying 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
            } text-white shadow-lg`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Info & Progress */}
          <div className="flex-1 min-w-0">
            {/* Contact Name */}
            <div className="flex items-center gap-2 mb-1">
              <Volume2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-white truncate">
                {playingCall.name}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {playingCall.phone}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-9 text-right font-mono">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => { e.stopPropagation(); handleSeek(e); }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs text-gray-400 w-9 font-mono">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 hover:text-purple-300 transition-all"
            title="Expand (TikTok Mode)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Download Button */}
          <a
            href={proxyUrl}
            download={`recording-${playingCall.id}.mp3`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close Button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleStop(); }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Hint text - always visible but fades on hover */}
        <p 
          className="text-center text-xs text-gray-500 mt-2 transition-all duration-300"
          style={{
            opacity: isHovered ? 1 : 0.6,
            transform: isHovered ? 'translateY(0)' : 'translateY(-2px)',
            color: isHovered ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
          }}
        >
          {isHovered ? 'Click to expand • TikTok Mode 🎬' : 'Hover to expand'}
        </p>
      </div>
    </>
  );
}

export function ActivityLogsTable({ calls }: ActivityLogsTableProps) {
  const [filter, setFilter] = useState<'all' | 'today' | '7days'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [playingCall, setPlayingCall] = useState<PlayingCall | null>(null);
  const pageSize = 50; // Show 50 calls per page

  // Helper: Normalize status for comparison
  const normalizeStatus = (status: string | null): string => {
    if (!status) return 'unclassified';
    return status.toLowerCase().replace(/ /g, '_');
  };

  // Helper: Format date for search
  const formatDateForSearch = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Step 1: Filter calls based on selected time period
  const dateFilteredCalls = useMemo(() => {
    if (filter === 'all') return calls;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf7Days = new Date();
    startOf7Days.setDate(now.getDate() - 7);

    return calls.filter(call => {
      const callDate = new Date(call.created_at);
      if (filter === 'today') {
        return callDate >= startOfToday;
      } else if (filter === '7days') {
        return callDate >= startOf7Days;
      }
      return true;
    });
  }, [calls, filter]);

  // Step 2: Filter by status/disposition
  const statusFilteredCalls = useMemo(() => {
    if (statusFilter === 'all') return dateFilteredCalls;
    
    return dateFilteredCalls.filter(call => {
      const callStatus = normalizeStatus(call.outcome);
      return callStatus === statusFilter;
    });
  }, [dateFilteredCalls, statusFilter]);

  // Step 3: Filter by search query (name, phone, or date)
  const visibleCalls = useMemo(() => {
    if (!searchQuery) return statusFilteredCalls;

    const q = searchQuery.toLowerCase();
    return statusFilteredCalls.filter(call => {
      // Support both old and new field names
      const name = (call.lead_name || call.contact_name || '').toLowerCase();
      const phone = (call.phone_number || call.contact_phone || '').toLowerCase();
      const dateStr = formatDateForSearch(call.created_at).toLowerCase();
      
      return name.includes(q) || phone.includes(q) || dateStr.includes(q);
    });
  }, [statusFilteredCalls, searchQuery]);

  // Step 4: Pagination
  const totalPages = Math.ceil(visibleCalls.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCalls = visibleCalls.slice(startIndex, endIndex);

  // Reset to page 1 when any filter changes
  const handleFilterChange = (newFilter: 'all' | 'today' | '7days') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Helper: Get duration color class based on seconds
  const getDurationClass = (seconds: number | null): string => {
    if (!seconds) return 'text-gray-400';
    if (seconds < 20) return 'text-red-400';
    if (seconds < 60) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  // Helper: Get duration in seconds (handles both duration in minutes and duration_seconds)
  const getDurationSeconds = (call: any): number | null => {
    if (call.duration_seconds) return call.duration_seconds;
    if (call.duration) return Math.round(call.duration * 60); // Convert minutes to seconds
    return null;
  };

  // Handle play button click
  const handlePlayClick = (call: any) => {
    const name = call.lead_name || call.contact_name || 'Unknown';
    const phone = call.phone_number || call.contact_phone || '';
    
    setPlayingCall({
      id: call.id,
      name,
      phone: formatPhoneNumber(phone),
      recordingUrl: call.recording_url,
      transcript: call.transcript,
      outcome: call.outcome,
      duration: call.duration_seconds || (call.duration ? call.duration * 60 : undefined),
    });
  };

  // PDF Export Handler
  const handleExportPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246); // blue color
      doc.text('Sterling AI - Call History Report', 14, 15);
      
      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Calls: ${visibleCalls.length}`, 14, 27);
      
      // Prepare table data (support both old and new field names)
      const tableData = visibleCalls.map(call => [
        formatDateForSearch(call.created_at),
        new Date(call.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        call.lead_name || call.contact_name || 'Unknown',
        call.phone_number || call.contact_phone || 'N/A',
        formatDuration(call.duration ? call.duration * 60 : call.duration_seconds), // duration is in minutes, convert to seconds
        call.outcome?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'N/A',
      ]);
      
      // Generate table
      autoTable(doc, {
        head: [['Date', 'Time', 'Name', 'Phone', 'Duration', 'Status']],
        body: tableData,
        startY: 32,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246], // blue
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          textColor: 50,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 25 }, // Time
          2: { cellWidth: 50 }, // Name
          3: { cellWidth: 40 }, // Phone
          4: { cellWidth: 25 }, // Duration
          5: { cellWidth: 45 }, // Status
        },
        margin: { top: 32 },
      });
      
      // Save the PDF
      doc.save(`sterling-ai-call-history-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Helper: Format phone number
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'N/A';
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      // Handle numbers with country code
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Return original if format is unclear
    return phone;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return <span className="text-gray-400">No outcome</span>;

    const configs: Record<string, { label: string; className: string }> = {
      appointment_booked: {
        label: 'Booked',
        className: 'bg-green-500/20 text-green-400 border border-green-500/30'
      },
      not_interested: {
        label: 'Not Interested',
        className: 'bg-red-500/20 text-red-400 border border-red-500/30'
      },
      callback_later: {
        label: 'Call Back',
        className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      },
      live_transfer: {
        label: 'Transferred',
        className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      },
      unclassified: {
        label: 'Unclassified',
        className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      },
      other: {
        label: 'Other',
        className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      },
    };

    const config = configs[outcome] || configs.other;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (calls.length === 0) {
    return (
      <div className="bg-[#1A2647] rounded-xl p-12 border border-gray-800 text-center">
        <div className="text-6xl mb-4">📞</div>
        <h3 className="text-xl font-bold text-white mb-2">No Calls Yet</h3>
        <p className="text-gray-400">Answered calls will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1A2647] rounded-xl border border-gray-800 overflow-hidden">
        {/* Header with Title and Time Filters */}
        <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white">Call History</h3>
          <div className="flex gap-1 bg-[#0B1437] p-1 rounded-lg border border-gray-700">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === 'today'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange('7days')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === '7days'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Last 7 Days
            </button>
          </div>
        </div>

        {/* Filter Bar: Status Dropdown, Search, and Export */}
        <div className="px-6 py-4 border-b border-gray-800 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-[#0B1437]/30">
          {/* Left: Status Filter Dropdown */}
          <div className="flex items-center gap-3">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-300 whitespace-nowrap">
              Filter by Status:
            </label>
            <div className="relative">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="appearance-none pl-4 pr-12 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="not_interested">Not Interested</option>
                <option value="callback_later">Callback</option>
                <option value="live_transfer">Live Transfers</option>
                <option value="appointment_booked">Booked Appointments</option>
                <option value="unclassified">Unclassified</option>
              </select>
              {/* Custom Dropdown Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Search Bar and Export Button */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or date..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full lg:w-80 pl-10 pr-4 py-2 bg-[#1A2647] border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Export PDF Button */}
            <Button
              onClick={handleExportPdf}
              disabled={visibleCalls.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1437] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedCalls.map((call) => (
                <tr key={call.id} className="hover:bg-[#0B1437]/50 transition-colors">
                  {/* Date & Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white font-medium">
                      {new Date(call.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(call.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {call.lead_name || call.contact_name || 'Unknown'}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300 font-mono">
                      {formatPhoneNumber(call.phone_number || call.contact_phone)}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getDurationClass(getDurationSeconds(call))}`}>
                      {formatDuration(getDurationSeconds(call))}
                    </div>
                  </td>

                  {/* Status/Outcome */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getOutcomeBadge(call.outcome)}
                  </td>

                  {/* Recording - Simple Play Button */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {call.recording_url ? (
                      <button
                        onClick={() => handlePlayClick(call)}
                        className={`inline-flex items-center justify-center w-[85px] gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          playingCall?.id === call.id
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {playingCall?.id === call.id ? (
                          <>
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            <span>Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs">No recording</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#0B1437] border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              Showing {visibleCalls.length === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, visibleCalls.length)} of {visibleCalls.length} calls
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className={currentPage === page
                            ? 'bg-blue-600 hover:bg-blue-700 text-white min-w-[40px]'
                            : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 min-w-[40px]'
                          }
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-500 px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Audio Player - Shows when playing */}
      {playingCall && (
        <FloatingAudioPlayer
          playingCall={playingCall}
          onClose={() => setPlayingCall(null)}
        />
      )}
    </>
  );
}
