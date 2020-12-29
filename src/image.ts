export interface Drawable {
    toImageData(): ImageData;
}

export class Bitmap implements Drawable {
    public pixels: number[];
    public channelNumber: number;
    public width: number;
    public height: number;

    constructor(width: number, height: number, channelNumber = 1, fill?: number[] | number) {
        this.channelNumber = channelNumber;
        this.width = width;
        this.height = height;
        if (Array.isArray(fill)) {
            if (fill.length !== width * height * channelNumber) {
                throw new Error('Given pixel array does not match the dimension and the channel count.');
            }
            this.pixels = fill;
        } else {
            this.pixels = new Array(width * height * channelNumber).fill(fill ? fill : 0);
        }
    }

    static fromImageData(imageData: ImageData, channelNumber = 1) {
        const pixels = new Array(imageData.width * imageData.height * channelNumber);

        if (channelNumber < 2) {
            for (let i = 0; i < imageData.width * imageData.height; i++) {
                pixels[i] = [0, 1, 2].reduce((acc, j) => acc + imageData.data[i * 4 + j], 0) / 3;
            }
        } else {
            for (let i = 0; i < imageData.width * imageData.height; i++) {
                for (let c = 0; c < channelNumber && c < 3; c++) {
                    pixels[i * channelNumber + c] = imageData.data[i * 4 + c];
                }
            }
        }
        return new Bitmap(imageData.width, imageData.height, channelNumber, pixels);
    }

    max() {
        return this.pixels.reduce((max, val) => max > val ? max : val);
    }

    get(i: number, j: number, channelIdx = 0) {
        return this.pixels[(i * this.width + j) * this.channelNumber + channelIdx];
    }

    set(i: number, j: number, val: number, channelIdx = 0) {
        this.pixels[(i * this.width + j) * this.channelNumber + channelIdx] = val;
    }

    toImageData() {
        const data = new Uint8ClampedArray(this.width * this.height * 4);
        for (let i = 0; i < this.width * this.height; i++) {
            data[i * 4] = this.pixels[i * this.channelNumber];
            data[i * 4 + 1] = this.pixels[i * this.channelNumber + (this.channelNumber > 1 ? 1 : 0)];
            data[i * 4 + 2] = this.pixels[i * this.channelNumber + (this.channelNumber > 1 ? 2 : 0)];
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.width, this.height);
    }

    clone() {
        return new Bitmap(this.width, this.height, this.channelNumber, this.pixels.map(x => x));
    }

    toGrayScale() {
        if (this.channelNumber < 2) {
            return this.clone();
        }

        const pixels = new Array(this.width * this.height).fill(0);
        for (let i = 0; i < this.width * this.height; i++) {
            for (let c = 0; c < this.channelNumber; c++) {
                pixels[i] += this.pixels[i * this.channelNumber + c];
            }
            pixels[i] /= this.channelNumber;
        }
        return new Bitmap(this.width, this.height, 1, pixels);
    }

    toMultiChannel(channelNumber: number) {
        if (this.channelNumber > 1) {
            throw new Error('Image is already multi channel');
        }
        const pixels = new Array(this.width * this.height * channelNumber);
        for (let i = 0; i < this.width * this.height; i++) {
            for (let c = 0; c < channelNumber; c++) {
                pixels[i * channelNumber + c] = this.pixels[i];
            }
        }
        return new Bitmap(this.width, this.height, channelNumber, pixels);
    }
}
