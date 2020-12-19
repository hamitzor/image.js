import { Matrix } from './matrix';

export interface Drawable {
    toImageData(): ImageData;
}

export abstract class Pixel {
    constructor(operation: (val: number, channelIndex: number) => number) {
        this.update(operation);
    }
    abstract update(operation: (val: number, channelIndex: number) => number): this;
    abstract getChannel(channelIndex: number): number;
}

export abstract class BitmapImage extends Matrix<Pixel> implements Drawable {
    abstract clone(opts?: { empty: boolean }): BitmapImage;
    abstract toImageData(): ImageData;
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

export class RGBBitmapImage extends BitmapImage implements Drawable {
    static fromImageData(imageData: ImageData) {
        const data = new Array<RGBPixel>(imageData.width * imageData.height);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i] = new RGBPixel((_, idx) => imageData.data[i * 4 + idx]);
        }
        return new RGBBitmapImage(imageData.height, imageData.width, data);
    }

    clone(opts?: { empty: boolean }): RGBBitmapImage {
        const data = new Array<Pixel>(this.data.length);
        if (opts?.empty) {
            for (let i = 0; i < data.length; i++) {
                data[i] = new RGBPixel(() => 0);
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                data[i] = new RGBPixel(() => this.data[i].getChannel(0));
            }
        }
        return new RGBBitmapImage(this.rows, this.cols, data);
    }

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

export class IntensityBitmapImage extends BitmapImage implements Drawable {

    static fromImageData(imageData: ImageData) {
        const data = new Array<IntensityPixel>(imageData.width * imageData.height);
        for (let i = 0; i < imageData.width * imageData.height; i++) {
            data[i] = new IntensityPixel(() => (imageData.data[i * 4] + imageData.data[i * 4 + 1] + imageData.data[i * 4 + 2]) / 3);
        }
        return new IntensityBitmapImage(imageData.height, imageData.width, data);
    }

    clone(opts?: { empty: boolean }): IntensityBitmapImage {
        const data = new Array<Pixel>(this.data.length);
        if (opts?.empty) {
            for (let i = 0; i < data.length; i++) {
                data[i] = new IntensityPixel(() => 0);
            }
        } else {
            for (let i = 0; i < data.length; i++) {
                data[i] = new IntensityPixel(() => this.data[i].getChannel(0));
            }
        }
        return new IntensityBitmapImage(this.rows, this.cols, data);
    }

    toImageData() {
        const data = new Uint8ClampedArray(this.cols * this.rows * 4);
        for (let i = 0; i < this.cols * this.rows; i++) {
            data[i * 4] = this.data[i].getChannel(0);
            data[i * 4 + 1] = this.data[i].getChannel(0);
            data[i * 4 + 2] = this.data[i].getChannel(0);
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.cols, this.rows);
    }
}
