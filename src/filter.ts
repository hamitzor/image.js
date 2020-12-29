import { Bitmap } from './image';
import { Matrix } from './matrix';
import { gaussian } from './util';

export class BasicFilter extends Matrix<number> {
    run(source: Bitmap) {
        const filtered = new Bitmap(source.width, source.height, source.channelNumber);

        for (let i = 0; i < filtered.height; i++) {
            for (let j = 0; j < filtered.width; j++) {
                for (let m = 0; m < this.rows; m++) {
                    for (let n = 0; n < this.cols; n++) {
                        for (let c = 0; c < source.channelNumber; c++) {
                            const neighborPixel = source.get(i - ((this.rows - 1) / 2 - m), j - ((this.cols - 1) / 2 - n), c);
                            filtered.set(i, j, filtered.get(i, j, c) + (neighborPixel ? neighborPixel : 0) * this.get(m, n), c);
                        }
                    }
                }
            }
        }

        return filtered;
    }
}

export class GaussianBlur {
    private opts: Required<GaussianBlur.Opts> = { sigma: 1, n: 5 };
    private filter: BasicFilter;

    constructor(opts?: GaussianBlur.Opts) {
        if (opts) {
            this.setOpts(opts);
        }
    }

    setOpts(opts: GaussianBlur.Opts) {
        if (opts.n !== undefined && (typeof opts.n !== 'number' || opts.n < 3 || opts.n % 2 === 0)) {
            throw new Error('Kernel size (n) should be an odd number greater than 3');
        }

        if (opts.sigma !== undefined && opts.sigma <= 0) {
            throw new Error('Sigma should be a positive real number');
        }
        this.opts = Object.assign(this.opts, opts);

        const matrix: number[][] = Array.from({ length: this.opts.n }, () => new Array(this.opts.n).fill(0));
        let dist = Array.from({ length: this.opts.n }, (_, x) => gaussian(-2 + x * (4 / (this.opts.n - 1)), this.opts.sigma));
        const sum = dist.reduce((acc, val) => acc + val, 0);
        dist = dist.map(x => x / sum);
        for (let x = 0; x < this.opts.n; x++) {
            for (let y = 0; y < this.opts.n; y++) {
                matrix[x][y] = dist[x] * dist[y];
            }
        }
        this.filter = new BasicFilter(matrix);
    }

    run(source: Bitmap) {
        return this.filter.run(source);
    }
}

export namespace GaussianBlur {
    export interface Opts {
        sigma?: number;
        n?: number;
    }
}


export class Sobel {
    private dxFilter: BasicFilter;

    constructor() {
        this.dxFilter = new BasicFilter([
            [1, 0, -1],
            [2, 0, -2],
            [1, 0, -1]
        ]);
    }

    run(source: Bitmap) {

        if (source.channelNumber > 1) {
            source = source.toGrayScale();
        }

        const gx = this.dxFilter.run(source);
        const gy = this.dxFilter.transpose().run(source);

        const g = new Bitmap(source.width, source.height);
        const theta = new Bitmap(source.width, source.height);

        for (let i = 0; i < source.height; i++) {
            for (let j = 0; j < source.width; j++) {
                theta.set(i, j, Math.atan2(gy.get(i, j), gx.get(i, j)));
                g.set(i, j, Math.sqrt(Math.pow(gy.get(i, j), 2) + Math.pow(gx.get(i, j), 2)));
            }
        }
        return { g, theta };
    }
}
