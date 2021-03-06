/**
 * Represents an object that can be drawn into a canvas.
 */
export interface Drawable {
    /**
     * Return an ImageData instance that represents the image.
     * @returns Created image data.
     */
    toImageData(): ImageData;
}

/**
 * Represents a bitmap image with arbitrary channels.
 */
export class Bitmap implements Drawable {

    /**
     * A 1-D array that contains consecutive pixel data with consecutive channel values.
     */
    public pixels: number[];

    /**
     * The channel count of the image.
     */
    public channelNumber: number;

    /**
     * The width of the image.
     */
    public width: number;

    /**
     * The height of the image.
     */
    public height: number;

    /**
     * Create a bitmap image.
     * @param width - Width of the image in pixels.
     * @param height - Height of the image in pixels.
     * @param channelNumber - Channel count of the image, default is 1 (grayscale).
     * @param fill - A value to fill the image (in all channels), or an array that holds
     * consecutive pixel data with consecutive channel values. If omitted, 0 will be used.
     */
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

    /**
     * A factory method that can be used to derive an image object from a native ImageData instance.
     * @param imageData - The image data to be used.
     * @param channelNumber - Channel count of the image, default is 1 (grayscale).
     * @returns A image object populated with the data from the image data.
     */
    static fromImageData(imageData: ImageData, channelNumber = 1) {
        const pixels = new Array(imageData.width * imageData.height * channelNumber);

        if (channelNumber < 2) {
            // If the channel number is 1, use the average of RGB values from image data.
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

    /**
     * Get the global maximum pixel value in the image.
     * @returns The maximum value.
     */
    max() {
        return this.pixels.reduce((max, val) => max > val ? max : val);
    }

    /**
     * Get the channel value of a pixel at a given position.
     * @param i - The row of the pixel.
     * @param j - The column of the pixel.
     * @param channelIdx - The channel number.
     * @returns The channel value.
     */
    get(i: number, j: number, channelIdx = 0) {
        return this.pixels[(i * this.width + j) * this.channelNumber + channelIdx];
    }

    /**
     * Set the channel value of a pixel at a given position.
     * @param i - The row of the pixel.
     * @param j - The column of the pixel.
     * @param channelIdx - The channel number.
     * @param val - The new value.
     */
    set(i: number, j: number, val: number, channelIdx = 0) {
        this.pixels[(i * this.width + j) * this.channelNumber + channelIdx] = val;
    }

     /**
     * Create an ImageData instance that represents the image.
     * @returns Created image data
     */
    toImageData() {
        const data = new Uint8ClampedArray(this.width * this.height * 4);
        for (let i = 0; i < this.width * this.height; i++) {
            data[i * 4] = this.pixels[i * this.channelNumber];
            // ImageData instances strictly hold 4 channels (R,G,B, alfa), so in case of an image with single channel,
            // populate RGB channels with that single channel.
            data[i * 4 + 1] = this.pixels[i * this.channelNumber + (this.channelNumber > 1 ? 1 : 0)];
            data[i * 4 + 2] = this.pixels[i * this.channelNumber + (this.channelNumber > 1 ? 2 : 0)];
            // Always ignore transparency in images, so fill with 255, which makes the image fully opaque.
            data[i * 4 + 3] = 255;
        }
        return new ImageData(data, this.width, this.height);
    }

    /**
     * Clone the image.
     * @returns Cloned image.
     */
    clone() {
        return new Bitmap(this.width, this.height, this.channelNumber, this.pixels.map(x => x));
    }

    /**
     * Return grayscale image. This method does not mutate the original object.
     * @returns Created grayscale image.
     */
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

    /**
     * Rise the number of channels to any number. Can only be invoked on single channel images.
     * @returns Created multi-channel image.
     */
    toMultiChannel(channelNumber: number) {
        // When the image is already multichannel, conversion cannot be done without ambiguity, so just throw an error.
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
