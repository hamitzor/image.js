import { Pixel, PixelImage } from "./pixel-image";
import { Matrix } from './matrix';

export interface ConvolutionOpts {
    normalize?: boolean;
    factor?: number;
}

const DEFAULT_OPTS: ConvolutionOpts = {
    normalize: false,
    factor: 1
};

export class Convolution {

    private sumOfWeights: number;
    public kernel: Matrix;

    constructor(kernel: Matrix | number[][], private opts?: ConvolutionOpts) {
        this.opts = Object.assign(Object.assign({}, DEFAULT_OPTS), opts);

        this.kernel = kernel instanceof Matrix ? kernel : new Matrix(kernel);

        if (this.opts.normalize) {
            this.sumOfWeights = this.kernel.data.reduce((acc, row) => row.reduce((_acc, val) => _acc + val * this.opts?.factor!, 0) + acc, 0);
        }
    }

    apply(pixelImage: PixelImage, x: number, y: number) {
        if (x > 0 && y > 0 && x < pixelImage.imageData.width - 1 && y < pixelImage.imageData.height - 1) {
            let res: Pixel = { r: 0, g: 0, b: 0 };
            for (let m = 0; m < this.kernel.data.length; m++) {
                for (let n = 0; n < this.kernel.data.length; n++) {
                    const neighbourPixel = pixelImage.getPixel(
                        x - ((this.kernel.data.length - 1) / 2 - m),
                        y - ((this.kernel.data.length - 1) / 2 - n)
                    );
                    res.r += neighbourPixel.r * this.kernel.data[m][n] * this.opts?.factor!;
                    res.g += neighbourPixel.g * this.kernel.data[m][n] * this.opts?.factor!;
                    res.b += neighbourPixel.b * this.kernel.data[m][n] * this.opts?.factor!;
                }
            }
            if (this.opts!.normalize) {
                res.r /= this.sumOfWeights;
                res.g /= this.sumOfWeights;
                res.b /= this.sumOfWeights;
            }
            return res;
        } else {
            return pixelImage.getPixel(x, y);
        }
    }
}