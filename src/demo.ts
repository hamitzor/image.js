import { Bitmap, Drawable } from './image';
import { GaussianBlur, Sobel } from './filter';
import { Canny } from './feature';
import { KMeansSegmentation } from './segmentation';

const ELS = {
    app: document.getElementById('app') as HTMLDivElement,
    input: document.getElementById('input') as HTMLCanvasElement,
    output: document.getElementById('output') as HTMLCanvasElement,
    imageInput: document.getElementById('imageInput') as HTMLInputElement,
    loadImage: document.getElementById('loadImage') as HTMLButtonElement,
    gaussianBlur: document.getElementById('gaussianBlur') as HTMLAnchorElement,
    sobelOperator: document.getElementById('sobelOperator') as HTMLAnchorElement,
    canny: document.getElementById('canny') as HTMLAnchorElement,
    cannyLow: document.getElementById('cannyLow') as HTMLInputElement,
    cannyHigh: document.getElementById('cannyHigh') as HTMLInputElement,
    kmeans: document.getElementById('kmeans') as HTMLAnchorElement
};

const CANVAS_SIZE = 600;

class DemoApp {

    private imageWidth: number;
    private imageHeight: number;

    constructor() {
        [ELS.input, ELS.output].forEach(canvas => {
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            canvas.onwheel = e => {
                canvas.getContext('2d')?.scale(2, 2);
            };
            this.clearCanvas(canvas);
        });

        ELS.loadImage.onclick = () => {
            ELS.imageInput.click();
        };

        ELS.imageInput.onchange = () => {
            const file = ELS.imageInput.files?.[0];
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file!);
            fileReader.onload = () => {
                const img = document.createElement('img');
                img.src = fileReader.result!.toString();
                img.onload = () => {
                    this.imageWidth = img.naturalWidth;
                    this.imageHeight = img.naturalHeight;

                    if (this.imageWidth > CANVAS_SIZE || this.imageHeight > CANVAS_SIZE) {
                        if (this.imageWidth > this.imageHeight) {
                            this.imageHeight = this.imageHeight * (CANVAS_SIZE / this.imageWidth);
                            this.imageWidth = CANVAS_SIZE;
                        } else {
                            this.imageWidth = this.imageWidth * (CANVAS_SIZE / this.imageHeight);
                            this.imageHeight = CANVAS_SIZE;
                        }
                    }
                    this.renderImage(ELS.input, img);
                    this.renderImage(ELS.output, img);
                    ELS.imageInput.value = '';
                };
            };
        };

        ELS.gaussianBlur.onclick = () => {
            this.renderImage(
                ELS.output,
                new GaussianBlur().run(Bitmap.fromImageData(this.getImageData(ELS.output), 3))
            );
        };


        ELS.sobelOperator.onclick = () => {
            this.renderImage(
                ELS.output,
                new Sobel().run(Bitmap.fromImageData(this.getImageData(ELS.output), 3)).g
            );
        };

        ELS.canny.onclick = () => {
            this.renderImage(
                ELS.output,
                new Canny({
                    lowThresholdRatio: parseFloat(ELS.cannyLow.value),
                    highThresholdRatio: parseFloat(ELS.cannyHigh.value),
                    gaussianBlurOpts: { n: 5, sigma: 1 }
                }).run(Bitmap.fromImageData(this.getImageData(ELS.output)))
            );
        };

        ELS.kmeans.onclick = () => {
            this.renderImage(
                ELS.output,
                new KMeansSegmentation({
                    colors:
                        [[212, 71, 0],
                        [214, 237, 23],
                        [0, 100, 181]]
                }).run(Bitmap.fromImageData(this.getImageData(ELS.output), 3))
            );
        };
    }

    private clearCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    private getImageData(canvas: HTMLCanvasElement) {
        return canvas.getContext('2d')!.getImageData(
            (CANVAS_SIZE - this.imageWidth) / 2,
            (CANVAS_SIZE - this.imageHeight) / 2,
            this.imageWidth,
            this.imageHeight
        );
    }

    private renderImage(canvas: HTMLCanvasElement, img: HTMLImageElement): void;
    private renderImage(canvas: HTMLCanvasElement, img: Drawable): void;
    private renderImage(canvas: HTMLCanvasElement, img: HTMLImageElement | Drawable) {
        this.clearCanvas(canvas);
        const ctx = canvas.getContext('2d')!;
        const dx = (CANVAS_SIZE - this.imageWidth) / 2;
        const dy = (CANVAS_SIZE - this.imageHeight) / 2;
        if (img instanceof HTMLImageElement) {
            ctx.drawImage(img, dx, dy, this.imageWidth, this.imageHeight);
        } else {
            ctx.putImageData(img.toImageData(), dx, dy);
        }
    }
}

const main = () => {
    (window as any).ELS = ELS;
    (window as any).demo = new DemoApp();
};

document.addEventListener('DOMContentLoaded', main);
