/**
 * Generate a random real number between `min` and `max`.
 * @param max - maximum value.
 * @param min - minimum value.
 * @returns generated random number.
 */
export const random = (max: number, min = 0) => min + Math.floor(Math.random() * Math.floor(max));

/**
 * Sample from gaussian distribution with 0 mean.
 * @param x - x value.
 * @param sigma - standard deviation of the gaussian distribution.
 * @returns likelihood of x.
 */
export const gaussian = (x: number, sigma = 1) => (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / sigma, 2));
