import type { VirtualPlan } from '../types';

export const createVirtualPlanFromDimensions = (width: number, depth: number, roomType: string): VirtualPlan => ({
  units: 'meters',
  totalFloorArea: width * depth,
  totalWallLength: (width + depth) * 2,
  rooms: [{
    id: 'room-1',
    type: roomType as any,
    boundary: [{x:0,y:0},{x:width,y:0},{x:width,y:depth},{x:0,y:depth}],
    walls: ['w1','w2','w3','w4'],
    area: width * depth,
  }],
  walls: [],
  doors: [],
  windows: [],
});
