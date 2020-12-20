import { BitmapImage, IntensityBitmapImage, IntensityPixel, RGBBitmapImage } from './image';
import { Matrix } from './matrix';

export interface GaussianBlurOpts {
    n?: number;
    sigma?: number;
}

export class BasicFilter extends Matrix<number> {
    run(source: BitmapImage) {
        const cloned = source.clone({ empty: true });
        for (let i = 0; i < source.rows; i++) {
            for (let j = 0; j < source.cols; j++) {
                for (let m = 0; m < this.rows; m++) {
                    for (let n = 0; n < this.cols; n++) {
                        const neighborPixel = source.get(
                            i - ((this.rows - 1) / 2 - m),
                            j - ((this.cols - 1) / 2 - n)
                        );
                        cloned.get(i, j).update((acc, idx) => acc + (neighborPixel ? neighborPixel.getChannel(idx) : 0) * this.get(m, n));
                    }
                }
            }
        }
        return cloned;
    }
}

export class GaussianBlur {
    private filter = new BasicFilter([
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0219, 0.0983, 0.1621, 0.0983, 0.0219],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030]
    ]);

    run(source: BitmapImage) {
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

    run(source: IntensityBitmapImage | RGBBitmapImage) {

        if (source instanceof RGBBitmapImage) {
            source = source.toGrayScale();
        }

        const gx = this.dxFilter.run(source);
        const gy = this.dxFilter.transpose().run(source);

        const g = source.clone({ empty: true });
        const theta =  source.clone({ empty: true });

        for (let i = 0; i < source.rows; i++) {
            for (let j = 0; j < source.cols; j++) {
                theta.get(i, j).update((_, idx) => Math.atan2(gy.get(i, j).getChannel(idx), gx.get(i, j).getChannel(idx)));
                g.get(i, j).update((_, idx) =>
                    Math.sqrt(Math.pow(gy.get(i, j).getChannel(idx), 2) + Math.pow(gx.get(i, j).getChannel(idx), 2))
                );
            }
        }
        return { g, theta };
    }
}
