import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black/50 border-t border-white/10 py-4 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-white/70 text-sm">
          Creado por Rafael Hilario Torres © {currentYear}
        </p>
      </div>
    </footer>
  );
};

export default Footer; 