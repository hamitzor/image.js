import { Convolution } from "./convolution";

class ExtendedImageData extends ImageData {
    setAlfaToMaximum() {
        for (let i = 0; i < this.width * this.height; i++) {
            this.data[i * 4 + 3] = 255;
        }
    }
}

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
            this.imageData = new ExtendedImageData(arg0, arg1);
            (this.imageData as ExtendedImageData).setAlfaToMaximum();
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
            imageData = new ExtendedImageData(this.width, this.height);
            (this.imageData as ExtendedImageData).setAlfaToMaximum();
        }
        return new PixelImage(imageData);
    }

    each(cb: (pixel: Pixel, x: number, y: number) => Pixel | void) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
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

    convolution(convolution: Convolution) {
        return convolution.apply(this);
    }

    add(pixelImage: PixelImage) {
        this.each((_, x, y) => {
            if (x < pixelImage.width && y < pixelImage.height) {
                const pixel0 = this.getPixel(x, y);
                const pixel1 = pixelImage.getPixel(x, y);
                return {
                    r: pixel0.r + pixel1.r,
                    g: pixel0.g + pixel1.g,
                    b: pixel0.b + pixel1.b
                };
            }
        });
        return this;
    }
}