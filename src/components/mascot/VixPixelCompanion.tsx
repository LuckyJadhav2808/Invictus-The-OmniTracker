'use client';

import React from 'react';
import { StrobiCompanion, type StrobiState, type StrobiGear, type StrobiCompanionProps } from './StrobiCompanion';

export type VixPixelState = StrobiState;
export type VixGearType = StrobiGear;
export type VixPixelCompanionProps = StrobiCompanionProps;

/**
 * Backward compatibility alias for VixPixelCompanion -> Upgraded to StrobiCompanion
 */
export function VixPixelCompanion(props: StrobiCompanionProps) {
  return <StrobiCompanion {...props} />;
}
