import type { ReactNode } from 'react';
import { MAC_SCREEN } from '../../config/calibration';

export function MacScreen({ children }: { children: ReactNode }) {
  const { l, t, w, h } = MAC_SCREEN;
  return (
    <div
      className='mac-screen'
      style={{ position: 'absolute', left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
    >
      {children}
    </div>
  );
}
