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
    run(source: Bitmap, colors: number[][] | number, byIntensity = true) {
        const samples = new KMeansSegmentationBitmap(byIntensity ? source.toGrayScale() : source);
        const kmeans = new KMeans(samples, { clusterNumber: Array.isArray(colors) ? colors.length : colors, maxIterations: 50 });
        const { clusters, centroids } = kmeans.run();

        const result = byIntensity ? samples.toMultiChannel(3) : samples;

        if (!Array.isArray(colors)) {
            for (let i = 0; i < result.width * result.height; i++) {
                result.pixels[i * 3] = centroids[clusters[i]][0];
                result.pixels[i * 3 + 1] = centroids[clusters[i]][byIntensity ? 0 : 1];
                result.pixels[i * 3 + 2] = centroids[clusters[i]][byIntensity ? 0 : 2];
            }
        } else {
            for (let i = 0; i < result.width * result.height; i++) {
                result.pixels[i * 3] = colors[clusters[i]][0];
                result.pixels[i * 3 + 1] = colors[clusters[i]][1];
                result.pixels[i * 3 + 2] = colors[clusters[i]][2];
            }
        }


        return result;
    }
}
