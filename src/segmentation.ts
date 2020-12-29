import { Bitmap } from './image';
import { KMeans } from './k-means';

class KMeansSegmentationBitmap extends Bitmap implements KMeans.Samples {

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

export class KMeansSegmentation {

    private opts: Required<KMeansSegmentation.Opts> = { byIntensity: false, colors: 3 };

    constructor(opts?: KMeansSegmentation.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
    }

    setOpts(opts: KMeansSegmentation.Opts) {
        this.opts = Object.assign(this.opts, opts);
    }

    run(source: Bitmap) {
        const samples = new KMeansSegmentationBitmap(this.opts.byIntensity ? source.toGrayScale() : source);
        const kmeans = new KMeans(samples,
            { clusterNumber: Array.isArray(this.opts.colors) ? this.opts.colors.length : this.opts.colors, maxIterations: 50 });
        const { clusters, centroids } = kmeans.run();

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
    }
}

export namespace KMeansSegmentation {
    export interface Opts {
        colors?: number[][] | number;
        byIntensity?: boolean;
    }
}
