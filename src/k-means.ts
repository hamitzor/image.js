import { random } from './util';

/**
 * Represents a K-Means clustering.
 */
export class KMeans {

    /**
     * The options.
     * @internal
     */
    private opts = { maxIterations: 0, clusterNumber: 2 };

    /**
     * Create a K-Means clustering object.
     * @param opts - The options.
     */
    constructor(opts?: KMeans.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
    }

    /**
     * Update the options.
     * @param opts - The new options.
     */
    setOpts(opts: KMeans.Opts) {
        this.opts = Object.assign(this.opts, opts);
    }

    /**
     * Start clustering.
     * @param samples - The samples.
     * @returns An object with two fields:
     *  - `clusters`: an array that holds cluster index for each sample.
     *  - `centroids`: an array that holds the centroid of each cluster.
     */
    run(samples: KMeans.Samples): Promise<{ clusters: number[], centroids: number[][] }> {
        return new Promise((resolve, reject) => {
            try {
                // Initialize the centroids with 0.
                const centroids: number[][] = Array.from({ length: this.opts.clusterNumber },
                    () => new Array(samples.dimensionNumber).fill(0));
                // An array holds the cluster index of each sample. All points belong to the first cluster at the beginning.
                const sampleClusterIdxes: number[] = new Array(samples.length).fill(0);
                let numberOfIterations = 0;
                let centroidsDoNotChangeFor = 0;
                let clustersDoNotChangeFor = 0;

                const randomCentroids: number[][] = [];

                // Determine unique centroids.
                while (randomCentroids.length < this.opts.clusterNumber) {
                    const randIdx = random(samples.length - 1);
                    if (
                        randomCentroids.filter(centroid => {
                            return centroid.map((v, d) => v - samples.get(randIdx, d)).filter(v => v === 0).length === centroid.length;
                        }
                        ).length < 1
                    ) {
                        centroids[randomCentroids.length] = centroids[randomCentroids.length].map((_, d) => samples.get(randIdx, d));
                        randomCentroids.push(centroids[randomCentroids.length]);
                    }
                }

                do {
                    let clusterChanged = false;
                    for (let sampleIdx = 0; sampleIdx < samples.length; sampleIdx++) {
                        let closestCentroidIdx = 0;
                        let closestCentroidDistance = Infinity;
                        for (let clusterIdx = 0; clusterIdx < centroids.length; clusterIdx++) {
                            let distance = 0;
                            for (let d = 0; d < samples.dimensionNumber; d++) {
                                distance += Math.pow(centroids[clusterIdx][d] - samples.get(sampleIdx, d), 2);
                            }
                            distance = Math.sqrt(distance);
                            if (distance < closestCentroidDistance) {
                                closestCentroidDistance = distance;
                                closestCentroidIdx = clusterIdx;
                            }
                        }

                        if (!clusterChanged && sampleClusterIdxes[sampleIdx] !== closestCentroidIdx) {
                            clusterChanged = true;
                        }
                        sampleClusterIdxes[sampleIdx] = closestCentroidIdx;
                    }

                    if (clusterChanged) {
                        clustersDoNotChangeFor = 0;
                    } else {
                        clustersDoNotChangeFor++;
                    }

                    let newCentroids = Array.from({ length: this.opts.clusterNumber }, () => new Array(samples.dimensionNumber).fill(0));

                    for (let sampleIdx = 0; sampleIdx < samples.length; sampleIdx++) {
                        for (let d = 0; d < samples.dimensionNumber; d++) {
                            newCentroids[sampleClusterIdxes[sampleIdx]][d] += samples.get(sampleIdx, d);
                        }
                    }

                    newCentroids = newCentroids.map((centroid, clusterIdx) =>
                        centroid.map(x => x / sampleClusterIdxes.filter(idx => idx === clusterIdx).length));

                    let centroidsChanged = false;

                    for (let centroidIdx = 0; centroidIdx < centroids.length; centroidIdx++) {
                        for (let d = 0; d < samples.dimensionNumber; d++) {
                            if (centroids[centroidIdx][d] !== newCentroids[centroidIdx][d]) {
                                centroids[centroidIdx][d] = newCentroids[centroidIdx][d];
                                centroidsChanged = true;
                            }
                        }
                    }

                    if (centroidsChanged) {
                        centroidsDoNotChangeFor = 0;
                    } else {
                        centroidsDoNotChangeFor++;
                    }
                    numberOfIterations++;
                }
                while (!(
                    (centroidsDoNotChangeFor > 2) ||
                    (clustersDoNotChangeFor > 2) ||
                    (this.opts.maxIterations !== 0 && numberOfIterations > this.opts.maxIterations)
                ));

                resolve({ clusters: sampleClusterIdxes, centroids });

            } catch (err) {
                reject(err);
            }
        });
    }
}

export namespace KMeans {

    /**
     * Represents options for K-Means.
     */
    export interface Opts {
        /**
         * The number maximum iterations. When it is exceeded, algorithm stops immediately.
         */
        maxIterations?: number;
        /**
         * The number clusters.
         */
        clusterNumber?: number;
    }

    /**
     * Represents the input of a K-Means algorithm. All inputs shall implement this interface.
     */
    export interface Samples {
        /**
         * The number of samples.
         */
        readonly length: number;
        /**
         * The dimension of the samples.
         */
        readonly dimensionNumber: number;
        /**
         * A getter method that returns i-th sample's value in `dimension`-th dimension.
         */
        get(idx: number, dimension: number): number;
    }
}
