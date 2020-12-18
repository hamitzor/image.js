import { IntensityImage, RGBImage } from "./image";
import { Matrix } from './matrix';

export interface GaussianBlurOpts {
    n?: number;
    sigma?: number;
}

export interface Filter {
    run(source: IntensityImage): any;
}

export class BasicFilter extends Matrix implements Filter {

    runOnPixel(image: IntensityImage, i: number, j: number) {
        if (i > 0 && j > 0 && i < image.rows - 1 && j < image.cols - 1) {
            let res = 0;
            for (let m = 0; m < this.rows; m++) {
                for (let n = 0; n < this.cols; n++) {
                    const neighborPixel = image.get(
                        i - ((this.rows - 1) / 2 - m),
                        j - ((this.cols - 1) / 2 - n)
                    );
                    res += neighborPixel * this.get(m, n);
                }
            }
            return res;
        } else {
            return image.get(i, j);
        }
    }

    run(source: IntensityImage) {
        return source.each((_, i, j) => this.runOnPixel(source, i, j));
    }
}

export class GaussianBlur implements Filter {
    private filter = new BasicFilter([
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0219, 0.0983, 0.1621, 0.0983, 0.0219],
        [0.0133, 0.0596, 0.0983, 0.0596, 0.0133],
        [0.0030, 0.0133, 0.0219, 0.0133, 0.0030]
    ]);

    run(source: IntensityImage) {
        return this.filter.run(source);
    }
}


export class Sobel implements Filter {
    private dxFilter: BasicFilter;

    constructor() {
        this.dxFilter = new BasicFilter([
            [1, 0, -1],
            [2, 0, -2],
            [1, 0, -1]
        ]);
    }

    run(source: IntensityImage | RGBImage) {
        if (source instanceof RGBImage) {
            source = source.toGrayScale();
        }
        const gx = this.dxFilter.run(source);
        const gy = this.dxFilter.transpose().run(source);

        const g = new IntensityImage(source.rows, source.cols);
        const theta = new IntensityImage(source.rows, source.cols);

        source.each((_, i, j) => {
            theta.set(i, j, Math.atan2(gy.get(i, j), gx.get(i, j)));
            g.set(i, j, Math.sqrt(Math.pow(gy.get(i, j), 2) + Math.pow(gx.get(i, j), 2)));
        });
        return { g, theta };
    }
}