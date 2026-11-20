import React from 'react';

export const WrapperScene: React.FC = () => {
  return (
    <section
      id="scene-3"
      className="absolute inset-0 pointer-events-none select-none z-20"
      style={{ visibility: 'hidden', opacity: 0 }}
      aria-hidden="true"
    />
  );
};
