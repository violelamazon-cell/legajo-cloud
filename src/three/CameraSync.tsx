import { useFrame, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { rig } from '../animations/rig';

export function CameraSync() {
  const { camera, size } = useThree();
  useFrame(() => {
    const fov = ((camera as PerspectiveCamera).fov * Math.PI) / 180;
    const baseZ = size.height / (2 * Math.tan(fov / 2)); // 1 unidad = 1 px en z=0
    camera.position.set(-rig.tx / rig.s, rig.ty / rig.s, baseZ / rig.s);
  });
  return null;
}
