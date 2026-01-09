import React, { useState, useEffect } from 'react';
import './BookingsLoader.css';

const BookingsLoader = () => {
  const [message, setMessage] = useState("Fetching your bookings...");

  // Optional: cycle through friendly messages if loading takes too long (>2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage("Hang tight, organizing your itinerary... ✈️");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="loader-container" role="status" aria-live="polite">
      {/* Iconly-style Ticket Icon with Floating Animation */}
      <div className="loader-icon-wrapper">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="iconly-ticket"
        >
          <path 
            d="M16.5 21H7.5C5.01472 21 3 18.9853 3 16.5V7.5C3 5.01472 5.01472 3 7.5 3H16.5C18.9853 3 21 5.01472 21 7.5V16.5C21 18.9853 18.9853 21 16.5 21Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M3 12H21" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            strokeDasharray="4 4" 
            opacity="0.5"
          />
          <path 
            d="M9 16H15" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Modern Horizontal Loading Bar */}
      <div className="loader-progress-track">
        <div className="loader-progress-bar"></div>
      </div>

      {/* Friendly Microcopy */}
      <p className="loader-text">{message}</p>
    </div>
  );
};

export default BookingsLoader;