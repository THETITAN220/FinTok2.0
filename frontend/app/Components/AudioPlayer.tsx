"use client";

import { useState, useRef, useEffect } from "react";

interface CustomAudioPlayerProps {
  audioUrl: string;
}

const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset states when audio URL changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    
    const setAudioData = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoaded(true);
      }
    };

    const setAudioTime = () => {
      if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("durationchange", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);
    
    // Try to load the metadata right away
    if (audio.readyState >= 2) {
      setAudioData();
    }

    // Clean up event listeners
    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("durationchange", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      // If the audio hasn't loaded yet, try to load it first
      if (!isLoaded) {
        audio.load();
      }
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Number(e.target.value);
    if (!isNaN(newTime) && isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number): string => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  return (
    <div className="flex items-center space-x-2 py-2 w-full">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <button 
        onClick={togglePlay} 
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isPlaying ? "bg-indigo-600" : "bg-indigo-500"
        } hover:bg-indigo-700 transition-colors shadow-md`}
      >
        {isPlaying ? (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
            <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
          </svg>
        ) : (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5v14l14-7z" fill="currentColor"></path>
          </svg>
        )}
      </button>
      
      <div className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</div>
      
      <div className="flex-grow">
        <input 
          type="range" 
          min="0" 
          max={isLoaded && duration > 0 ? duration : 100} 
          value={currentTime} 
          onChange={handleSliderChange} 
          disabled={!isLoaded}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
            isLoaded ? 'bg-indigo-100 accent-indigo-600' : 'bg-gray-200'
          }`}
        />
      </div>
      
      <div className="text-xs text-gray-500 w-10">{isLoaded ? formatTime(duration) : "--:--"}</div>
    </div>
  );
};

export default CustomAudioPlayer;