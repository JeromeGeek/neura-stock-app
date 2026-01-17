
import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={onHomeClick}
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75h1.5m15 0h1.5M8.25 21v-1.5m1.5.75H12m6 0h-1.5M12 4.5v3.75m0 7.5v3.75m-3.75-11.25h7.5c.621 0 1.125.504 1.125 1.125v7.5c0 .621-.504 1.125-1.125 1.125h-7.5c-.621 0-1.125-.504-1.125-1.125v-7.5c0-.621.504-1.125 1.125-1.125z" />
          </svg>
          <h1 className="text-xl font-bold text-white">NEURA</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
