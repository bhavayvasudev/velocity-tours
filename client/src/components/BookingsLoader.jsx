import React, { useState, useEffect } from 'react';
import './BookingsLoader.css';
import { Loader2 } from 'lucide-react';

const BookingsLoader = () => {
  const [currentEmoji, setCurrentEmoji] = useState(0);
  
  // ✈️ Lively Travel Emojis
  const emojis = ["✈️", "🏨", "🌍", "🧳", "📸", "🗺️", "🎫", "🥥"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % emojis.length);
    }, 500); // Change emoji every 500ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loader-wrapper">
      <div className="loader-content">
        
        {/* Animated Emoji Circle */}
        <div className="emoji-cycler">
          <span key={currentEmoji} className="emoji animate-pop">
            {emojis[currentEmoji]}
          </span>
        </div>

        {/* Loading Bar */}
        <div className="loading-track">
          <div className="loading-bar"></div>
        </div>

        {/* Friendly Message */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-slate-700 dark:text-white">
            Fetching details...
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gathering your latest trip data
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingsLoader;