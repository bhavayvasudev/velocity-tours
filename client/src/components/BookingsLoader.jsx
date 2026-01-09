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
  
  // 🎨 Cycle through travel icons
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
    }, 600); // Switch icon every 600ms
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = icons[activeIconIndex].component;

  return (
    <div className="loader-container-light">
      <div className="loader-content">
        
        {/* Animated Icon Circle */}
        <div className="icon-cycler-light">
          <div key={activeIconIndex} className="icon-wrapper animate-pop-in">
            {ActiveIcon}
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1 mb-2">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">
            Fetching details...
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            Syncing your latest trip data
          </p>
        </div>

        {/* Modern Linear Progress Bar */}
        <div className="progress-container">
          <div className="progress-track-light">
            <div className="progress-bar-light"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingsLoader;