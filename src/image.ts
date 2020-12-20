import { Matrix } from './matrix';

export interface Drawable {
    toImageData(): ImageData;
}

export abstract class Pixel {
    constructor(operation?: (val: number, channelIndex: number) => number) {
        this.update(operation ? operation : () => 0);
    }
    abstract update(operation: (val: number, channelIndex: number) => number): this;
    abstract getChannel(channelIndex?: number): number;
}

export abstract class BitmapImage extends Matrix<Pixel> implements Drawable {
    abstract createInstanceForClone(): BitmapImage;
    toImageData() {
        const data = new Uint8ClampedArray(this.cols * this.rows * 4);
        for (let i = 0; i < this.cols * this.rows; i++) {
            data[i * 4] = this.data[i].getChannel(0);
            data[i * 4 + 1] = this.data[i].getChannel(1);
            data[i * 4 + 2] = this.data[i].getChannel(2);
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.cols, this.rows);
    }

    clone(opts?: { empty: boolean }): BitmapImage {
        const cloned = this.createInstanceForClone();
        if (!opts?.empty) {
            for (let i = 0; i < cloned.data.length; i++) {
                cloned.data[i].update((_, idx) => this.data[i].getChannel(idx));
            }
        }
        return cloned;
    }
}

export class RGBPixel extends Pixel {
    public r: number;
    public g: number;
    public b: number;

    update(operation: (val: number, channelIndex: number) => number) {
        this.r = operation(this.r, 0);
        this.g = operation(this.g, 1);
        this.b = operation(this.b, 2);
        return this;
    }

    getChannel(channelIndex: number): number {
        switch (channelIndex) {
            case 0: return this.r;
            case 1: return this.g;
            default: return this.b;
        }
    }
}

export class RGBBitmapImage extends BitmapImage {
    static fromImageData(imageData: ImageData) {
        const data = new Array<RGBPixel>(imageData.width * imageData.height);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i] = new RGBPixel((_, idx) => imageData.data[i * 4 + idx]);
        }
        return new RGBBitmapImage(imageData.height, imageData.width, data);
    }

    createInstanceForClone() {
        return new RGBBitmapImage(this.rows, this.cols, Array.from({ length: this.rows * this.cols }, () => new RGBPixel()));
    }

    clone(opts?: { empty: boolean }) {
        return super.clone(opts);
    }

    toGrayScale() {
        const data = new Array<IntensityPixel>(this.rows * this.cols);
        for (let i = 0; i < this.rows * this.cols; i++) {
            data[i] = new IntensityPixel(() => (this.data[i].getChannel(0) + this.data[i].getChannel(1) + this.data[i].getChannel(2)) / 3);
        }
        return new IntensityBitmapImage(this.rows, this.cols, data);
    }
}

export class IntensityPixel extends Pixel {
    public intensity: number;

    update(operation: (val: number, channelIndex: number) => number) {
        this.intensity = operation(this.intensity, 0);
        return this;
    }

    getChannel(): number {
        return this.intensity;
    }
}

export class IntensityBitmapImage extends BitmapImage {

    static fromImageData(imageData: ImageData) {
        const data = new Array<IntensityPixel>(imageData.width * imageData.height);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i] = new IntensityPixel(() => (imageData.data[i * 4] + imageData.data[i * 4 + 1] + imageData.data[i * 4 + 2]) / 3);
        }
        return new IntensityBitmapImage(imageData.height, imageData.width, data);
    }

    createInstanceForClone() {
        return new IntensityBitmapImage(this.rows, this.cols, Array.from({ length: this.rows * this.cols }, () => new IntensityPixel()));
    }

    clone(opts?: { empty: boolean }) {
        return super.clone(opts);
    }
}
