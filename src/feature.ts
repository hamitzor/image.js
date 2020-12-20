import { GaussianBlur, Sobel } from './filter';
import { BitmapImage } from './image';

export interface CannyOpts {
    lowThreshold?: number;
    highThreshold?: number;
}

const WEAK = 100;
const STRONG = 255;


// @TODO: apply gaussian blurring. Set low and high threshold values more cleverly.
export class Canny {

    private opts = { lowThreshold: 50, highThreshold: 150 };

    constructor(opts?: CannyOpts) {
        this.opts = opts ? Object.assign(this.opts, opts) : this.opts;
    }

    private nonMaximumSuppression(g: BitmapImage, theta: BitmapImage) {
        const thinnedEdges = g.clone();
        for (let i = 2; i < thinnedEdges.rows - 2; i++) {
            for (let j = 2; j < thinnedEdges.cols - 2; j++) {
                let a = 255, b = 255;
                let angle = theta.get(i, j).getChannel() * 180 / Math.PI;
                if (angle < 0) {
                    angle += 180;
                }

                if ((0 <= angle && angle < 22.5) || (157.5 <= angle && angle <= 180)) {
                    a = g.get(i, j + 1).getChannel();
                    b = g.get(i, j - 1).getChannel();
                } else if (22.5 <= angle && angle < 67.5) {
                    a = g.get(i + 1, j + 1).getChannel();
                    b = g.get(i - 1, j - 1).getChannel();
                } else if (67.5 <= angle && angle < 112.5) {
                    a = g.get(i + 1, j).getChannel();
                    b = g.get(i - 1, j).getChannel();
                } else if (112.5 <= angle && angle < 157.5) {
                    a = g.get(i - 1, j + 1).getChannel();
                    b = g.get(i + 1, j - 1).getChannel();
                }

                if (g.get(i, j).getChannel() >= a && g.get(i, j).getChannel() >= b) {
                    thinnedEdges.get(i, j).update(() => g.get(i, j).getChannel());
                } else {
                    thinnedEdges.get(i, j).update(() => 0);
                }
            }
        }

        return thinnedEdges;
    }

    private threshold(g: BitmapImage, low: number, high: number) {
        const res = g.clone();
        for (let i = 2; i < res.rows - 2; i++) {
            for (let j = 2; j < res.cols - 2; j++) {
                res.get(i, j).update(val => {
                    if (val < low) {
                        return 0;
                    } else if (val < high) {
                        return WEAK;
                    } else {
                        return STRONG;
                    }
                });
            }
        }
        return res;
    }

    private hysteresis(g: BitmapImage) {
        for (let i = 2; i < g.rows - 2; i++) {
            for (let j = 2; j < g.cols - 2; j++) {
                g.get(i, j).update(val => {
                    if (val === WEAK) {
                        if (g.get(i - 1, j - 1).getChannel() === STRONG || g.get(i - 1, j).getChannel() === STRONG
                            || g.get(i - 1, j + 1).getChannel() === STRONG || g.get(i, j - 1).getChannel() === STRONG
                            || g.get(i, j + 1).getChannel() === STRONG || g.get(i + 1, j - 1).getChannel() === STRONG
                            || g.get(i + 1, j).getChannel() === STRONG || g.get(i + 1, j + 1).getChannel() === STRONG) {
                            return STRONG;
                        } else {
                            return 0;
                        }
                    } else {
                        return val;
                    }
                });
            }
        }
        return g;
    }

    run(source: BitmapImage) {
        const { g, theta } = new Sobel().run(new GaussianBlur().run(source));
        return this.hysteresis(this.threshold(this.nonMaximumSuppression(g, theta), this.opts.lowThreshold, this.opts.highThreshold));
    }
}
