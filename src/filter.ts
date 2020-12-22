import { Bitmap } from './image';
import { Matrix } from './matrix';

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

// @TODO: add opts.
export class GaussianBlur {
    private filter = new BasicFilter([
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0219, 0.0983, 0.1621, 0.0983, 0.0219],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030]
    ]);

    run(source: Bitmap) {
        return this.filter.run(source);
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
