
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 md:p-6 shadow-md ${className}`}>
      {children}
    </div>
  );
};

export default Card;
