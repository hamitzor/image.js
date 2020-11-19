import { Pixel, PixelImage } from "./pixel-image";

export type Kernel = number[][];

export interface ConvolutionOpts {
    repeat?: number;
    normalize?: boolean;
}

const DEFAULT_OPTS: ConvolutionOpts = {
    repeat: 1,
    normalize: false
};

export class Convolution {

    private sumOfWeights: number;

    constructor(public kernel: Kernel, private opts?: ConvolutionOpts) {
        this.opts = Object.assign(DEFAULT_OPTS, opts);
        if (this.opts.normalize) {
            this.sumOfWeights = this.kernel.reduce((acc, row) => row.reduce((_acc, val) => _acc + val, 0) + acc, 0);
        }
    }

    private applyKernelOnPixel(pixelImage: PixelImage, x: number, y: number) {
        if (x > 0 && y > 0 && x < pixelImage.imageData.width - 1 && y < pixelImage.imageData.height - 1) {
            let res: Pixel = { r: 0, g: 0, b: 0 };
            for (let m = 0; m < this.kernel.length; m++) {
                for (let n = 0; n < this.kernel.length; n++) {
                    const neighbourPixel = pixelImage.getPixel(
                        x - ((this.kernel.length - 1) / 2 - m),
                        y - ((this.kernel.length - 1) / 2 - n)
                    );
                    res.r += neighbourPixel.r * this.kernel[m][n];
                    res.g += neighbourPixel.g * this.kernel[m][n];
                    res.b += neighbourPixel.b * this.kernel[m][n];
                }
            }
            if (this.opts!.normalize) {
                res.r /= this.sumOfWeights;
                res.g /= this.sumOfWeights;
                res.b /= this.sumOfWeights;
            }
            return res;
        }
    }

    apply(pixelImage: PixelImage) {
        const _apply = (_pixelImage: PixelImage) => {
            const cloned = _pixelImage.clone();
            _pixelImage.each((_, x, y) => {
                return this.applyKernelOnPixel(cloned, x, y);
            });
            return _pixelImage;
        };
        _apply(pixelImage);
        return Array.from(Array(this.opts?.repeat).keys()).reduce(acc => _apply(acc), pixelImage);
    }
}