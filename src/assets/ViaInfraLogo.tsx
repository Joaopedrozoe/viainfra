import React from 'react';

export const ViaInfraLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 300 100" 
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Logo symbol - inspired by the V shape */}
        <g transform="translate(10,10)">
          {/* First V in green gradient */}
          <path 
            d="M0 20 L25 70 L50 20 L35 20 L25 45 L15 20 Z" 
            fill="url(#greenGradient)"
          />
          {/* Second V overlapping */}
          <path 
            d="M25 20 L50 70 L75 20 L60 20 L50 45 L40 20 Z" 
            fill="url(#darkGreenGradient)"
          />
        </g>
        
        {/* Text "viainfra" */}
        <g transform="translate(100,25)">
          <text 
            x="0" 
            y="35" 
            fill="#1a5490" 
            fontSize="28" 
            fontWeight="bold" 
            fontFamily="Arial, sans-serif"
          >
            viainfra
          </text>
        </g>
        
        {/* Gradients definition */}
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd321" />
            <stop offset="100%" stopColor="#5cb85c" />
          </linearGradient>
          <linearGradient id="darkGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5cb85c" />
            <stop offset="100%" stopColor="#449d44" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};