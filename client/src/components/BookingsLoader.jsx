import React, { useState, useEffect } from 'react';
import './BookingsLoader.css';
import { 
  Plane, 
  Building2, 
  Map, 
  Ticket, 
  Compass, 
  Briefcase 
} from 'lucide-react';

const BookingsLoader = () => {
  const [activeIconIndex, setActiveIconIndex] = useState(0);
  
  // 🎨 Iconly-style Icons to cycle through
  const icons = [
    { component: <Plane size={32} />, label: "Flights" },
    { component: <Building2 size={32} />, label: "Hotels" },
    { component: <Map size={32} />, label: "Itinerary" },
    { component: <Ticket size={32} />, label: "Bookings" },
    { component: <Compass size={32} />, label: "Exploring" },
    { component: <Briefcase size={32} />, label: "Business" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIconIndex((prev) => (prev + 1) % icons.length);
    }, 600); // Cycle every 600ms
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = icons[activeIconIndex].component;

  return (
    <div className="loader-container-dark">
      <div className="loader-content">
        
        {/* Animated Icon Circle */}
        <div className="icon-cycler">
          <div key={activeIconIndex} className="icon-wrapper animate-fade-scale">
            {ActiveIcon}
          </div>
        </div>

        {/* Loading Bar */}
        <div className="loading-track-dark">
          <div className="loading-bar-dark"></div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-white tracking-wide">
            Fetching details...
          </h3>
          <p className="text-sm text-slate-400">
            Hold tight, we're organizing your trips
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingsLoader;