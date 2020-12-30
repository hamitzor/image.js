import { Bitmap } from './image';
import { Matrix } from './matrix';
import { gaussian } from './util';

/**
 * Represents a convolution.
 * @extends Matrix
 */
export class BasicFilter extends Matrix<number> {

    /**
    * Start doing the convolution. This method doesn't mutate the source image.
    * @param source - Source image
    * @returns - A promise that is resolved with the resulting image. (with original channel count)
    */
    run(source: Bitmap): Promise<Bitmap> {
        return new Promise((resolve, reject) => {
            try {
                // Create a brand new image object that keeps the filtered image.
                const filtered = new Bitmap(source.width, source.height, source.channelNumber);

                for (let i = 0; i < filtered.height; i++) {
                    for (let j = 0; j < filtered.width; j++) {
                        for (let m = 0; m < this.rows; m++) {
                            for (let n = 0; n < this.cols; n++) {
                                // Do convolution for each channel.
                                for (let c = 0; c < source.channelNumber; c++) {
                                    let neighborPixel = source.get(i - ((this.rows - 1) / 2 - m), j - ((this.cols - 1) / 2 - n), c);
                                    // If the pixel doesn't exist (in case when it falls outside of the image) just assume it is 0.
                                    neighborPixel = neighborPixel ? neighborPixel : 0;
                                    filtered.set(i, j, filtered.get(i, j, c) + neighborPixel * this.get(m, n), c);
                                }
                            }
                        }
                    }
                }
                resolve(filtered);
            } catch (err) {
                reject(err);
            }
        });
    }
}

/**
 * Represents a gaussian blur filter.
 */
export class GaussianBlur {
    private opts: Required<GaussianBlur.Opts> = { sigma: 1, n: 5 };
    private filter: BasicFilter;

    /**
     * Create a gaussian blur filter.
     * @param opts - Options for the gaussian blurring.
     */
    constructor(opts?: GaussianBlur.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
        this.updateFilter();
    }

    /**
     * Update options.
     * @param opts - Options for the gaussian blurring.
     */
    setOpts(opts: GaussianBlur.Opts) {
        if (opts.n !== undefined && (typeof opts.n !== 'number' || opts.n < 3 || opts.n % 2 === 0)) {
            throw new Error('Kernel size should be an odd number greater than 3');
        }

        if (opts.sigma !== undefined && opts.sigma <= 0) {
            throw new Error('Sigma should be a positive real number');
        }
        // Just override the options that exist in given options object.
        this.opts = Object.assign(this.opts, opts);

        // Make sure filter is updated as it depends on the options.
        this.updateFilter();
    }

    /**
     * Update the filter. This constructs a kernel for given kernel size (n) and standard deviation (sigma).
     * @internal
     */
    private updateFilter() {
        // Initialize the kernel with zeros.
        const matrix: number[][] = Array.from({ length: this.opts.n }, () => new Array(this.opts.n).fill(0));

        // Create an array that holds n evenly spaced samples from 1D gaussian distribution between -2*sigma and 2*sigma.
        let dist = Array.from({ length: this.opts.n }, (_, x) => gaussian(-2 + x * (4 / (this.opts.n - 1)), this.opts.sigma));

        // Divide each element by the overall sum, to make sure the array adds up to 1.
        const sum = dist.reduce((acc, val) => acc + val, 0);
        dist = dist.map(x => x / sum);

        // Construct the resulting kernel. Since there is no correlation between axes, just multiply two 1D gaussian distributions
        // to find the value of 2D gaussian distribution at any position.
        for (let x = 0; x < this.opts.n; x++) {
            for (let y = 0; y < this.opts.n; y++) {
                matrix[x][y] = dist[x] * dist[y];
            }
        }
        this.filter = new BasicFilter(matrix);
    }

    /**
     * Do a convolution and return the result. This method does not mutate the original image.
     * @param source - Source image.
     * @returns - A promise that resolves with resulting image (with original channel count).
     */
    run(source: Bitmap) {
        return this.filter.run(source);
    }
}

export namespace GaussianBlur {
    /**
     * Represents options for the gaussian blurring.
     */
    export interface Opts {
        /**
         * Standard deviation of the gaussian distribution
         */
        sigma?: number;
        /**
         * Size of the kernel
         */
        n?: number;
    }
}

/**
 * Represents a sobel filter.
 */
export class Sobel {
    private dxFilter: BasicFilter;

    /**
     * Create a sobel filter.
     */
    constructor() {
        // Create the kernel that finds the horizontal derivative.
        this.dxFilter = new BasicFilter([
            [1, 0, -1],
            [2, 0, -2],
            [1, 0, -1]
        ]);
    }

    /**
     * Run the filter.
     * @param source - The source image.
     * @returns A promise that resolves with the resulting image (with single channel).
     */
    run(source: Bitmap) {
        // Make the image grayscale, if not.
        if (source.channelNumber > 1) {
            source = source.toGrayScale();
        }

        return Promise.all([
            this.dxFilter.run(source), // Horizontal gradients.
            this.dxFilter.transpose().run(source) // Vertical gradients.
        ]).then(([gx, gy]) => {
            // Create the image object that holds the magnitude of the gradients.
            const g = new Bitmap(source.width, source.height);
            // Create the image object that holds the direction of the gradients.
            const theta = new Bitmap(source.width, source.height);

            // Fill image objects with appropriate values.
            for (let i = 0; i < source.height; i++) {
                for (let j = 0; j < source.width; j++) {
                    theta.set(i, j, Math.atan2(gy.get(i, j), gx.get(i, j)));
                    g.set(i, j, Math.sqrt(Math.pow(gy.get(i, j), 2) + Math.pow(gx.get(i, j), 2)));
                }
            }
            return { g, theta };
        });
    }
}
