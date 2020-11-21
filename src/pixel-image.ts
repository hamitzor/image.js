import { Convolution } from "./convolution";
import { Filter } from "./filter";

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
            for (let i = 0; i < this.width * this.height * 4; i = i + 4) {
                this.imageData.data[i + 3] = 255;
            }
        }
        this.width = this.imageData.width;
        this.height = this.imageData.height;
    }

    clone(empty = false) {
        let imageData: ImageData;
        if (!empty) {
            const data = new Uint8ClampedArray(this.width * this.height * 4);
            data.set(this.imageData.data);
            imageData = new ImageData(data, this.width, this.height);
        } else {
            imageData = new ImageData(this.width, this.height);
            for (let i = 0; i < this.width * this.height * 4; i = i + 4) {
                imageData.data[i + 3] = 255;
            }
        }
        return new PixelImage(imageData);
    }

    each(cb: (pixel: Pixel, x: number, y: number) => Pixel | void) {
        const clone = this.clone(true);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const out = cb(this.getPixel(x, y), x, y);
                if (out) {
                    clone.setPixel(x, y, out);
                }
            }
        }
        return clone;
    }

    makeGrayscale() {
        return this.clone(true).each((_, x, y) => {
            const pixel = this.getPixel(x, y);
            const average = (pixel.r + pixel.g + pixel.b) / 3;
            return { r: average, g: average, b: average };
        });
    }

    getPixel(x: number, y: number) {
        const i = (y * this.width + x) * 4;
        return {
            r: this.imageData.data[i],
            g: this.imageData.data[i + 1],
            b: this.imageData.data[i + 2]
        };
    }

    setPixel(x: number, y: number, pixel: Pixel) {
        const i = (y * this.width + x) * 4;
        this.imageData.data[i] = pixel.r;
        this.imageData.data[i + 1] = pixel.g;
        this.imageData.data[i + 2] = pixel.b;
    }

    filter(filter: Filter) {
        return filter.filter(this);
    }
}
