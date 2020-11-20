import { Convolution } from "./convolution";

export interface Pixel { r: number, g: number, b: number }

export class PixelImage {
    public imageData: ImageData;
    public width: number;
    public height: number;

    constructor(width: number, height: number);
    constructor(imageData: ImageData);
    constructor(arg0: any, arg1?: any) {
        if (arg0 instanceof ImageData) {
            this.imageData = arg0;
        } else {
            this.imageData = new ImageData(arg0, arg1);
            for (let i = 0; i < arg0 * arg1; i++) {
                this.imageData.data[i * 4 + 3] = 255;
            }
        }
        this.width = this.imageData.width;
        this.height = this.imageData.height;
    }

    clone() {
        const data = new Uint8ClampedArray(this.imageData.width * this.imageData.height * 4);
        data.set(this.imageData.data, 0);
        return new PixelImage(new ImageData(data, this.imageData.width, this.imageData.height));
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

    convolution(convolution: Convolution) {
        return convolution.apply(this);
    }
}