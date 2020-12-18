import { Matrix } from "./matrix";

export interface Drawable {
    toImageData(): ImageData;
}

export class IntensityImage extends Matrix implements Drawable {
    static fromImageData(imageData: ImageData) {
        const data = new Array<number>(imageData.width * imageData.height);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i] = (imageData.data[i * 4] + imageData.data[i * 4 + 1] + imageData.data[i * 4 + 2]) / 3;
        }
        return new IntensityImage(imageData.height, imageData.width, data);
    }

    toImageData() {
        const data = new Uint8ClampedArray(this.cols * this.rows * 4);
        for (let i = 0; i < this.cols * this.rows; i++) {
            data[i * 4] = this.data[i];
            data[i * 4 + 1] = this.data[i];
            data[i * 4 + 2] = this.data[i];
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.cols, this.rows);
    }

    clone() {
        let data = new Array(0).concat(this.data);
        return new IntensityImage(this.rows, this.cols, data);
    }

    each(cb: (intensity: number, i: number, j: number) => number | void) {
        const clone = this.clone();
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const out = cb(this.get(i, j), i, j);
                if (typeof out === 'number') {
                    clone.set(i, j, out);
                }
            }
        }
        return clone;
    }
}

class Pixel {
    r: number;
    b: number;
    g: number;
    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
}

export class RGBImage implements Drawable {
    protected data: Array<number>;
    public rows: number;
    public cols: number;

    constructor(height: number, width: number, data: Array<number>) {
        this.rows = height;
        this.cols = width;
        this.data = data;
    }

    static fromImageData(imageData: ImageData) {
        const data = new Array<number>(imageData.width * imageData.height * 3);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i * 3] = imageData.data[i * 4];
            data[i * 3 + 1] = imageData.data[i * 4 + 1];
            data[i * 3 + 2] = imageData.data[i * 4 + 2];
        }
        return new RGBImage(imageData.height, imageData.width, data);
    }

    toImageData() {
        const data = new Uint8ClampedArray(this.cols * this.rows * 4);
        for (let i = 0; i < this.cols * this.rows; i++) {
            data[i * 4] = this.data[i * 3];
            data[i * 4 + 1] = this.data[i * 3 + 1];
            data[i * 4 + 2] = this.data[i * 3 + 2];
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.cols, this.rows);
    }

    clone() {
        let data = new Array(0).concat(this.data);
        return new RGBImage(this.rows, this.cols, data);
    }

    each(cb: (pixel: Pixel, x: number, y: number) => Pixel | void) {
        const clone = this.clone();
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const out = cb(this.get(i, j), i, j);
                if (out) {
                    clone.set(i, j, out);
                }
            }
        }
        return clone;
    }

    toGrayScale() {
        const data = new Array<number>(this.rows * this.cols);
        for (let i = 0; i < this.rows * this.cols; i++) {
            data[i] = (this.data[i * 3] + this.data[i * 3 + 1] + this.data[i * 3 + 2]) / 3;
        }
        return new IntensityImage(this.rows, this.cols, data);
    }

    get(i: number, j: number) {
        const offset = (i * this.cols + j) * 3;
        return new Pixel(this.data[offset + 0], this.data[offset + 1], this.data[offset + 2]);
    }

    set(i: number, j: number, pixel: Pixel) {
        const offset = (i * this.cols + j) * 3;
        this.data[offset] = pixel.r;
        this.data[offset + 1] = pixel.g;
        this.data[offset + 2] = pixel.b;
    }
}
