import { GaussianBlur, Sobel } from './filter';
import { Bitmap } from './image';

export class Canny {

    private opts: Required<Canny.Opts> = {
        lowThresholdRatio: 0.2,
        highThresholdRatio: 0.5,
        gaussianOpts: {
            n: 5,
            sigma: 1
        }
    };

    constructor(opts?: Canny.Opts) {
        this.opts.gaussianOpts = opts?.gaussianOpts ? Object.assign(this.opts.gaussianOpts, opts.gaussianOpts) : this.opts.gaussianOpts;
        delete opts?.gaussianOpts;
        this.opts = opts ? Object.assign(this.opts, opts) : this.opts;
    }

    private nonMaximumSuppression(g: Bitmap, theta: Bitmap) {
        const thinnedEdges = new Bitmap(g.width, g.height);
        for (let i = 2; i < thinnedEdges.height - 2; i++) {
            for (let j = 2; j < thinnedEdges.width - 2; j++) {
                let a = 255, b = 255;
                let angle = theta.get(i, j) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 180;
                }

                if ((0 <= angle && angle < 22.5) || (157.5 <= angle && angle <= 180)) {
                    a = g.get(i, j + 1);
                    b = g.get(i, j - 1);
                } else if (22.5 <= angle && angle < 67.5) {
                    a = g.get(i + 1, j + 1);
                    b = g.get(i - 1, j - 1);
                } else if (67.5 <= angle && angle < 112.5) {
                    a = g.get(i + 1, j);
                    b = g.get(i - 1, j);
                } else if (112.5 <= angle && angle < 157.5) {
                    a = g.get(i - 1, j + 1);
                    b = g.get(i + 1, j - 1);
                }

                if (g.get(i, j) >= a && g.get(i, j) >= b) {
                    thinnedEdges.set(i, j, g.get(i, j));
                } else {
                    thinnedEdges.set(i, j, 0);
                }
            }
        }

        return thinnedEdges;
    }

    private threshold(g: Bitmap, low: number, high: number) {
        const res = g.clone();
        for (let i = 2; i < res.height - 2; i++) {
            for (let j = 2; j < res.width - 2; j++) {
                const pixel = res.get(i, j);
                if (pixel < low) {
                    res.set(i, j, 0);
                } else if (pixel < high) {
                    res.set(i, j, Canny.WEAK);
                } else {
                    res.set(i, j, Canny.STRONG);
                }
            }
        }
        return res;
    }

    private hysteresis(g: Bitmap) {
        for (let i = 2; i < g.height - 2; i++) {
            for (let j = 2; j < g.width - 2; j++) {
                const pixel = g.get(i, j);
                if (pixel === Canny.WEAK) {
                    if (g.get(i - 1, j - 1) === Canny.STRONG || g.get(i - 1, j) === Canny.STRONG
                        || g.get(i - 1, j + 1) === Canny.STRONG || g.get(i, j - 1) === Canny.STRONG
                        || g.get(i, j + 1) === Canny.STRONG || g.get(i + 1, j - 1) === Canny.STRONG
                        || g.get(i + 1, j) === Canny.STRONG || g.get(i + 1, j + 1) === Canny.STRONG
                    ) {
                        g.set(i, j, Canny.STRONG);
                    } else {
                        g.set(i, j, 0);
                    }
                }
            }
        }
        return g;
    }

    run(source: Bitmap) {
        const { g, theta } = new Sobel().run(new GaussianBlur(this.opts.gaussianOpts).run(source));

        const highThreshold = source.max() * this.opts.highThresholdRatio;
        const lowThreshold = highThreshold * this.opts.lowThresholdRatio;

        return this.hysteresis(this.threshold(this.nonMaximumSuppression(g, theta), lowThreshold, highThreshold));
    }
}

export namespace Canny {
    export interface Opts {
        lowThresholdRatio?: number;
        highThresholdRatio?: number;
        gaussianOpts?: GaussianBlur.Opts;
    }

    export const WEAK = 100;
    export const STRONG = 255;
}
