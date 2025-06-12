import type { Easing } from './animation'

const c = 1.701_58
const n = 7.5625
const d = 2.75

function inverse(f: Easing): Easing {
  return (x: number): number => 1 - f(1 - x)
}

function solve(
  easeIn: Easing,
  easeOut?: Easing,
): Easing {
  easeOut ??= inverse(easeIn)

  return (x: number): number =>
    x < 0.5 ? easeIn(x * 2) / 2 : (easeOut(x * 2 - 1) + 1) / 2
}

function _(
  easeIn: Easing,
): [Easing, Easing, Easing] {
  const easeOut: Easing = inverse(easeIn)
  const easeInOut: Easing = solve(easeIn, easeOut)

  return [easeIn, easeOut, easeInOut]
}

const easeSine: Easing = x => 1 - Math.cos((x * Math.PI) / 2)
export const [easeInSine, easeOutSine, easeInOutSine] = _(easeSine)

export const [easeInQuad, easeOutQuad, easeInOutQuad] = _(x => x ** 2)
export const [easeInCubic, easeOutCubic, easeInOutCubic] = _(x => x ** 3)
export const [easeInQuart, easeOutQuart, easeInOutQuart] = _(x => x ** 4)
export const [easeInQuint, easeOutQuint, easeInOutQuint] = _(x => x ** 5)

const easeExpo: Easing = x => x || 2 ** (10 * x - 10)
const easeCirc: Easing = x => 1 - Math.sqrt(1 - x ** 2)
const easeBack: Easing = x => (c + 1) * x ** 3 - c * x ** 2
export const [easeInExpo, easeOutExpo, easeInOutExpo] = _(easeExpo)
export const [easeInCirc, easeOutCirc, easeInOutCirc] = _(easeCirc)
export const [easeInBack, easeOutBack, easeInOutBack] = _(easeBack)

const easeElastic: Easing = x =>
  -Math.sin(((80 * x - 44.5) * Math.PI) / 9) * 2 ** (20 * x - 11)
export const easeInElastic: Easing = x =>
  -Math.sin(((20 * x - 21.5) * Math.PI) / 3) * 2 ** (10 * x - 10)
export const easeOutElastic: Easing = inverse(easeInElastic)
export const easeInOutElastic: Easing = solve(easeElastic)

export const easeBounce: Easing = (x: number): number =>
  x < 1 / d
    ? n * x ** 2
    : x < 2 / d
      ? n * (x - 1.5 / d) ** 2 + 0.75
      : x < 2.5 / d
        ? n * (x - 2.25 / d) ** 2 + 0.9375
        : n * (x - 2.625 / d) ** 2 + 0.984_375
