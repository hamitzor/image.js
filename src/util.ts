export const random = (max: number, min = 0) => min + Math.floor(Math.random() * Math.floor(max));

export const gaussian = (x: number, sigma = 1) => (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x / sigma, 2));
