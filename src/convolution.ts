import { Pixel, PixelImage } from "./pixel-image";

export class Convolution {

    private kernel: number[][];

    constructor() {
        this.kernel = [
            [1, 4, 6, 4, 1],
            [4, 16, 24, 16, 4],
            [6, 24, 36, 24, 6],
            [4, 16, 24, 16, 4],
            [1, 4, 6, 4, 1],
        ];
    }

    private getPixelForKernelElement(pixelImage: PixelImage, x: number, y: number, m: number, n: number) {
        return pixelImage.getPixel(
            x - ((this.kernel.length - 1) / 2 - m),
            y - ((this.kernel.length - 1) / 2 - n)
        );
    }

    private applyKernelOnPixel(pixelImage: PixelImage, x: number, y: number) {
        if (x > 0 && y > 0 && x < pixelImage.getImageData().width - 1 && y < pixelImage.getImageData().height - 1) {
            let res: Pixel = { r: 0, g: 0, b: 0 };
            for (let m = 0; m < this.kernel.length; m++) {
                for (let n = 0; n < this.kernel.length; n++) {
                    const neighbourPixel = this.getPixelForKernelElement(pixelImage, x, y, m, n);
                    res.r += neighbourPixel.r * this.kernel[m][n];
                    res.g += neighbourPixel.g * this.kernel[m][n];
                    res.b += neighbourPixel.b * this.kernel[m][n];
                }
            }
            const sumOfWeights = this.kernel.reduce((acc, row) => row.reduce((_acc, val) => _acc + val, 0) + acc, 0);
            res.r /= sumOfWeights;
            res.g /= sumOfWeights;
            res.b /= sumOfWeights;
            return res;
        }
    }

    apply(pixelImage: PixelImage) {
        const clonedPixelImage = pixelImage.clone();
        pixelImage.each((_, x, y) => this.applyKernelOnPixel(clonedPixelImage, x, y));
        return pixelImage.getImageData();
    }
}