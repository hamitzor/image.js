import { Convolution, Kernel } from "./convolution";

export interface Pixel { r: number, g: number, b: number }

export class PixelImage {
    private imageData: ImageData;
    constructor(imageData: ImageData) {
        this.imageData = imageData;
    }

    clone() {
        const newImageData = new ImageData(this.imageData.width, this.imageData.height);
        for (let i = 0; i < newImageData.data.length; i++) {
            newImageData.data[i] = this.imageData.data[i];
        }
        return new PixelImage(newImageData);
    }

    getImageData() {
        return this.imageData;
    }

    each(cb: (pixel: Pixel, x: number, y: number) => Pixel | void) {
        for (let x = 0; x < this.imageData.width; x++) {
            for (let y = 0; y < this.imageData.height; y++) {
                const out = cb(this.getPixel(x, y), x, y);
                if (out) {
                    this.setPixel(x, y, out);
                }
            }
        }
        return this;
    }

    makeGrayscale() {
        this.each(({ r, g, b }) => {
            const average = (r + g + b) / 3;
            return { r: average, g: average, b: average };
        });
        return this;
    }

    getPixel(x: number, y: number) {
        const i = (y * this.imageData.width + x) * 4;
        return {
            r: this.imageData.data[i],
            g: this.imageData.data[i + 1],
            b: this.imageData.data[i + 2]
        };
    }

    setPixel(x: number, y: number, pixel: Pixel) {
        const i = (y * this.imageData.width + x) * 4;
        this.imageData.data[i] = pixel.r;
        this.imageData.data[i + 1] = pixel.g;
        this.imageData.data[i + 2] = pixel.b;
    }

    convolution(kernel: Kernel | Convolution, count = 1) {
        return Array.from(Array(count).keys()).reduce((acc) => (kernel instanceof Convolution ? kernel : new Convolution(kernel)).apply(acc), this);
    }
}