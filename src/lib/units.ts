import { UnitSystem } from '@/stores/userStore'

// Weight conversions (internal storage is in lbs)
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10
}

export function kgToLbs(kg: number): number {
  return Math.round(kg / 0.453592 * 10) / 10
}

// Height conversions (internal storage is in inches)
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54)
}

export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54)
}

// Format height for display
export function formatHeight(inches: number, units: UnitSystem): string {
  if (units === 'metric') {
    const cm = inchesToCm(inches)
    return `${cm} cm`
  }
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

// Format weight for display
export function formatWeight(lbs: number, units: UnitSystem): string {
  if (units === 'metric') {
    return `${lbsToKg(lbs)} kg`
  }
  return `${lbs} lbs`
}

// Get weight unit label
export function getWeightUnit(units: UnitSystem): string {
  return units === 'metric' ? 'kg' : 'lbs'
}

// Get height unit label
export function getHeightUnit(units: UnitSystem): string {
  return units === 'metric' ? 'cm' : 'in'
}

// Convert display weight to internal (lbs)
export function toInternalWeight(value: number, units: UnitSystem): number {
  return units === 'metric' ? kgToLbs(value) : value
}

// Convert internal weight to display
export function toDisplayWeight(lbs: number, units: UnitSystem): number {
  return units === 'metric' ? lbsToKg(lbs) : lbs
}

// Convert display height to internal (inches)
export function toInternalHeight(value: number, units: UnitSystem): number {
  return units === 'metric' ? cmToInches(value) : value
}

// Convert internal height to display
export function toDisplayHeight(inches: number, units: UnitSystem): number {
  return units === 'metric' ? inchesToCm(inches) : inches
}

// Parse height from feet/inches or cm input
export function parseHeight(feet: number, inches: number, units: UnitSystem): number {
  if (units === 'metric') {
    // feet is actually cm in metric mode
    return cmToInches(feet)
  }
  return feet * 12 + inches
}
