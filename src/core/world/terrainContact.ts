import type { Ground } from './ground';

export type ContactEffect = 'grass-swish' | 'water-ripple' | 'dust' | 'footprint' | null;

const CONTACT_EFFECT_BY_GROUND: Readonly<Record<Ground, Exclude<ContactEffect, null>>> = {
  grass: 'grass-swish',
  forest: 'grass-swish',
  mountain: 'dust',
  beach: 'footprint',
  shore: 'water-ripple',
  farm: 'grass-swish',
};

export function contactEffectFor(ground: Ground | null): ContactEffect {
  return ground === null ? null : (CONTACT_EFFECT_BY_GROUND[ground] ?? null);
}
