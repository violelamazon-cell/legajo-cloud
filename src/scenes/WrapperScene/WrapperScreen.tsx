import React from 'react';

export const WrapperScreen: React.FC = () => {
  return (
    <div
      id="scene-3-crt"
      className="crt-layer--wrapper absolute inset-0 w-full h-full font-mono flex flex-col justify-center text-[#3dff8a] z-20 pointer-events-none select-none crt-scanlines"
      style={{ visibility: 'hidden', opacity: 0 }}
    >
      <div className="crt-text">
        <div
          data-wrapper-crt="line-0"
          className="wr-title crt-title min-h-[1.2em]"
        />
        <div
          data-wrapper-crt="line-1"
          className="wr-l1 crt-line min-h-[1.2em]"
        />
        <div className="flex items-center">
          <span
            data-wrapper-crt="line-2"
            className="wr-l2 crt-line"
          />
          <span
            data-wrapper-crt="cursor"
            className="inline-block w-[0.45em] h-[0.85em] bg-[#3dff8a] animate-pulse ml-1.5"
            style={{
              boxShadow: '0 0 12px rgba(61,255,138,0.9)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
