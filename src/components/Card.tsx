import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-[#2e2e2e] border border-gray-700 rounded-xl shadow-lg
      ${hover ? 'hover:shadow-xl hover:border-gray-600 transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;