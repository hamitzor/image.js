import { Convolution, Kernel } from "./convolution";

export interface Pixel { r: number, g: number, b: number }

export class PixelImage {
    private _imageData: ImageData;
    constructor(imageData: ImageData) {
        this._imageData = imageData;
    }

    clone() {
        const data = new Uint8ClampedArray(this._imageData.width * this._imageData.height * 4);
        data.set(this._imageData.data, 0);
        return new PixelImage(new ImageData(data, this._imageData.width, this._imageData.height));
    }

    get imageData() {
        return this._imageData;
    }

    each(cb: (pixel: Pixel, x: number, y: number) => Pixel | void) {
        for (let x = 0; x < this._imageData.width; x++) {
            for (let y = 0; y < this._imageData.height; y++) {
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
        const i = (y * this._imageData.width + x) * 4;
        return {
            r: this._imageData.data[i],
            g: this._imageData.data[i + 1],
            b: this._imageData.data[i + 2]
        };
    }

    setPixel(x: number, y: number, pixel: Pixel) {
        const i = (y * this._imageData.width + x) * 4;
        this._imageData.data[i] = pixel.r;
        this._imageData.data[i + 1] = pixel.g;
        this._imageData.data[i + 2] = pixel.b;
    }

    convolution(convolution: Convolution) {
        return convolution.apply(this);
    }
}