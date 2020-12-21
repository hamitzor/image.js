export interface Drawable {
    toImageData(): ImageData;
}

export class Bitmap implements Drawable {
    private pixels: number[];
    public channelCount: number;
    public width: number;
    public height: number;

    constructor(width: number, height: number, channelCount = 1, fill?: number[] | number) {
        this.channelCount = channelCount;
        this.width = width;
        this.height = height;
        if (Array.isArray(fill)) {
            if (fill.length !== width * height * channelCount) {
                throw new Error('Given pixel array does not match the dimensions and the channel count.');
            }
            this.pixels = fill;
        } else {
            this.pixels = new Array(width * height * channelCount).fill(fill ? fill : 0);
        }
    }

    static fromImageData(imageData: ImageData, channelCount = 1) {
        const pixels = new Array(imageData.width * imageData.height * channelCount);

        if (channelCount < 2) {
            for (let i = 0; i < imageData.width * imageData.height; i++) {
                pixels[i] = [0, 1, 2].reduce((acc, j) => acc + imageData.data[i * 4 + j], 0) / 3;
            }
        } else {
            for (let i = 0; i < imageData.width * imageData.height; i++) {
                for (let c = 0; c < channelCount && c < 3; c++) {
                    pixels[i * channelCount + c] = imageData.data[i * 4 + c];
                }
            }
        }
        return new Bitmap(imageData.width, imageData.height, channelCount, pixels);
    }

    get(i: number, j: number, channelIdx = 0) {
        return this.pixels[(i * this.width + j) * this.channelCount + channelIdx];
    }

    set(i: number, j: number, val: number, channelIdx = 0) {
        this.pixels[(i * this.width + j) * this.channelCount + channelIdx] = val;
    }

    toImageData() {
        const data = new Uint8ClampedArray(this.width * this.height * 4);
        for (let i = 0; i < this.width * this.height; i++) {
            data[i * 4] = this.pixels[i * this.channelCount];
            data[i * 4 + 1] = this.pixels[i * this.channelCount + (this.channelCount > 1 ? 1 : 0)];
            data[i * 4 + 2] = this.pixels[i * this.channelCount + (this.channelCount > 1 ? 2 : 0)];
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.width, this.height);
    }

    clone() {
        return new Bitmap(this.width, this.height, this.channelCount, this.pixels.map(x => x));
    }

    toGrayScale() {
        if (this.channelCount < 2) {
            return this.clone();
        }

        const pixels = new Array(this.width * this.height).fill(0);
        for (let i = 0; i < this.width * this.height; i++) {
            for (let c = 0; c < this.channelCount; c++) {
                pixels[i] += this.pixels[i * this.channelCount + c];
            }
            pixels[i] /= this.channelCount;
        }
        return new Bitmap(this.width, this.height, 1, pixels);
    }
}
