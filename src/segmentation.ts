import { Bitmap } from './image';
import { KMeans } from './k-means';

/**
 * A class that makes {@link Bitmap}s usable as input of K-Means by implementing {@link KMeans.Samples}.
 * @extends Bitmap
 */
export class KMeansSegmentationBitmap extends Bitmap implements KMeans.Samples {

    /**
     * Construct an samples object that can be used as input of K-Means.
     * @param image - The original image.
     */
    constructor(image: Bitmap) {
        super(image.width, image.height, image.channelNumber, image.pixels);
    }

    get(idx: number, dimension: number) {
        return this.pixels[idx * this.channelNumber + dimension];
    }

    get length() {
        return this.width * this.height;
    }
    get dimensionNumber() {
        return this.channelNumber;
    }
}

/**
 * Represents K-Means segmentation on images.
 */
export class KMeansSegmentation {
    /**
     * The options.
     * @internal
     */
    private opts: Required<KMeansSegmentation.Opts> = { byIntensity: false, colors: 3 };
    /**
     * The actual Kmeans clustering object that performs segmentation.
     * @internal
     */
    private kmeans: KMeans;

    /**
     * Create a K-Means segmentation object.
     * @param opts - The options.
     */
    constructor(opts?: KMeansSegmentation.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
        this.updateKmeans();
    }

    /**
     * Update KMeans clustering object according to the current options.
     * @internal
     */
    private updateKmeans() {
        this.kmeans = new KMeans({
            clusterNumber: Array.isArray(this.opts.colors) ? this.opts.colors.length : this.opts.colors,
            maxIterations: 50
        });
    }

    /**
     * Update options.
     * @param opts - The new options.
     */
    setOpts(opts: KMeansSegmentation.Opts) {
        this.opts = Object.assign(this.opts, opts);
        this.updateKmeans();
    }

    /**
     * Start segmentation. This method does not mutate the source image.
     * @param source - Source image
     * @returns A promise that is resolved with the resulting image.
     * (single channel if `byIntensity` is set in {@link KMeansSegmentation.Opts})
     */
    run(source: Bitmap) {
        const samples = new KMeansSegmentationBitmap(this.opts.byIntensity ? source.toGrayScale() : source);
        return this.kmeans.run(samples).then(({ clusters, centroids }) => {
            const result = this.opts.byIntensity ? samples.toMultiChannel(3) : samples;

            if (!Array.isArray(this.opts.colors)) {
                for (let i = 0; i < result.width * result.height; i++) {
                    result.pixels[i * 3] = centroids[clusters[i]][0];
                    result.pixels[i * 3 + 1] = centroids[clusters[i]][this.opts.byIntensity ? 0 : 1];
                    result.pixels[i * 3 + 2] = centroids[clusters[i]][this.opts.byIntensity ? 0 : 2];
                }
            } else {
                for (let i = 0; i < result.width * result.height; i++) {
                    result.pixels[i * 3] = this.opts.colors[clusters[i]][0];
                    result.pixels[i * 3 + 1] = this.opts.colors[clusters[i]][1];
                    result.pixels[i * 3 + 2] = this.opts.colors[clusters[i]][2];
                }
            }
            return result;
        });
    }
}

export namespace KMeansSegmentation {
    /**
     * Represents options for K-Means segmentation on images.
     */
    export interface Opts {
        /**
         * Segment count. It is named colors, because it can also be used to directly specify the output color of the segments.
         * To specify colors, provide an array that contains colors as array of RGB values, e.g `[[0,0,0], [100,100,100]]`.
         * If only a number is supplied, then the colors will be derived from the mean of the segments. (Can be used to reduce the bit-dept)
         */
        colors?: number[][] | number;
        /**
         * Specifies whether use intensity (treat as grayscale) or the actual RGB values for doing segmentation when
         * the image is RGB colored.
         */
        byIntensity?: boolean;
    }
}
