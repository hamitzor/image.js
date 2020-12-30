import { GaussianBlur, Sobel } from './filter';
import { Bitmap } from './image';

/**
 * Represents a canny edge detection.
 */
export class Canny {

    /**
     * The options.
     */
    private opts: Required<Canny.Opts> = {
        lowThresholdRatio: 0.2,
        highThresholdRatio: 0.5,
        gaussianBlurOpts: {
            n: 5,
            sigma: 1
        }
    };

    /**
     * Create a canny edge detection object.
     * @param opts - The options.
     */
    constructor(opts?: Canny.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
    }

    /**
     * Update options.
     * @param opts - The new options.
     */
    setOpts(opts: Canny.Opts) {
        if (opts.gaussianBlurOpts) {
            this.opts.gaussianBlurOpts = Object.assign(this.opts.gaussianBlurOpts, opts.gaussianBlurOpts);
            delete opts.gaussianBlurOpts;
        }
        this.opts = Object.assign(this.opts, opts);
        if (typeof this.opts.lowThresholdRatio !== 'number' || typeof this.opts.highThresholdRatio !== 'number') {
            throw new Error('High and low threshold values should be real numbers between 0 and 1');
        }
        if (this.opts.lowThresholdRatio >= this.opts.highThresholdRatio) {
            throw new Error('Low threshold value should be smaller than high threshold value.');
        }
    }

    /**
     * Perform non-maximum suppression. This is the first step of canny edge detection and
     * is used to make the edges detected by Sobel thinner.
     * @param g - The bitmap image that holds the gradient magnitudes.
     * @param theta - The bitmap image that contains the gradient directions.
     * @returns A bitmap image that contains thinned edges
     * @internal
     */
    private nonMaximumSuppression(g: Bitmap, theta: Bitmap) {
        const thinnedEdges = new Bitmap(g.width, g.height);
        for (let i = 2; i < thinnedEdges.height - 2; i++) {
            for (let j = 2; j < thinnedEdges.width - 2; j++) {
                // a and b represents the neighbor pixels of the current pixel along the direction of the gradient.
                let a = 255, b = 255;
                let angle = theta.get(i, j) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 180;
                }

                // Determine a and b's values according to the gradient direction.
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

                // If current pixel is not the local maximum, suppress it.
                if (g.get(i, j) >= a && g.get(i, j) >= b) {
                    thinnedEdges.set(i, j, g.get(i, j));
                } else {
                    thinnedEdges.set(i, j, 0);
                }
            }
        }

        return thinnedEdges;
    }

    /**
     * Categorize the pixels into two groups: `Low <= Weak < High` and `High < Strong` according to the given threshold values.
     * Suppress the pixels that are lower than the low threshold.
     * @param g - The bitmap image that holds the gradient magnitudes.
     * @param low - The low threshold value.
     * @param high - The high threshold value.
     * @returns A bitmap image that contains categorized pixels.
     * @internal
     */
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

    /**
     * Perform hysteresis to only keep strong edges.
     * @param g - The bitmap image that holds the gradient magnitudes.
     * @returns A bitmap image that contains only the strong edges.
     * @internal
     */
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

    /**
     * Start the edge detection. This does not mutate the source image.
     * @param source - The source image.
     * @returns A promise that resolves with resulting image (with single channel).
     */
    run(source: Bitmap) {
        return new GaussianBlur(this.opts.gaussianBlurOpts).run(source)
            .then(res => new Sobel().run(res))
            .then(({ g, theta }) => {
                const highThreshold = source.max() * this.opts.highThresholdRatio;
                const lowThreshold = highThreshold * this.opts.lowThresholdRatio;
                return this.hysteresis(this.threshold(this.nonMaximumSuppression(g, theta), lowThreshold, highThreshold));
            });
    }
}

export namespace Canny {
    /**
     * Represents options for canny edge detection.
     */
    export interface Opts {
        /**
         * A value that is used to determine low threshold value while performing thresholding.
         * The formula: `Low Threshold Value = High Threshold Value x Low Threshold Ratio`
         */
        lowThresholdRatio?: number;
        /**
         * A value that is used to determine high threshold value while performing thresholding.
         * The formula: `High Threshold Value = Maximum Pixel Value in the Source Image x High Threshold Ratio`
         */
        highThresholdRatio?: number;
        /**
         * Options for gaussian blurring that is performed before starting edge detection.
         */
        gaussianBlurOpts?: GaussianBlur.Opts;
    }

    /**
     * Constant value for pixels categorized weak.
     * @internal
     */
    export const WEAK = 100;

    /**
     * Constant value for pixels categorized strong.
     * @internal
     */
    export const STRONG = 255;
}
