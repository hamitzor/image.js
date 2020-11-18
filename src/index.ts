import { Convolution } from "./convolution";
import { PixelImage } from "./pixel-image";

const els: {
    app: HTMLDivElement,
    input: HTMLCanvasElement,
    output: HTMLCanvasElement,
    imageInput: HTMLInputElement,
    loadImage: HTMLButtonElement,
    gaussianBlur: HTMLAnchorElement
} = {
    app: document.getElementById('app') as HTMLDivElement,
    input: document.getElementById('input') as HTMLCanvasElement,
    output: document.getElementById('output') as HTMLCanvasElement,
    imageInput: document.getElementById('imageInput') as HTMLInputElement,
    loadImage: document.getElementById('loadImage') as HTMLButtonElement,
    gaussianBlur: document.getElementById('gaussianBlur') as HTMLAnchorElement
};

const CANVAS_SIZE = 600;

class Analyser {

    private imageWidth: number;
    private imageHeight: number;

    constructor() {
        [els.input, els.output].forEach(canvas => {
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            this.clearCanvas(canvas);
        });

        els.loadImage.onclick = () => {
            els.imageInput.click();
        };

        els.imageInput.onchange = () => {
            const file = els.imageInput.files?.[0];
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
                    this.renderImage(els.input, img);
                    els.imageInput.value = '';
                };
            };
        };


        els.gaussianBlur.onclick = () => {
            const imageData = this.getImageDate(els.input);
            this.renderImage(els.output, new PixelImage(imageData).makeGrayscale()
                .convolution([
                    [1, 4, 6, 4, 1],
                    [4, 16, 24, 16, 4],
                    [6, 24, 36, 24, 6],
                    [4, 16, 24, 16, 4],
                    [1, 4, 6, 4, 1],
                ], 4)
                .convolution([
                    [1, 0, -1],
                    [2, 0, -2],
                    [1, 0, -1]
                ]));
        };
    }

    private clearCanvas(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    private getImageDate(canvas: HTMLCanvasElement) {
        return canvas.getContext('2d')!.getImageData(
            (CANVAS_SIZE - this.imageWidth) / 2,
            (CANVAS_SIZE - this.imageHeight) / 2,
            this.imageWidth,
            this.imageHeight
        );
    }

    private renderImage(canvas: HTMLCanvasElement, img: HTMLImageElement): void;
    private renderImage(canvas: HTMLCanvasElement, img: PixelImage): void;
    private renderImage(canvas: HTMLCanvasElement, img: any) {
        this.clearCanvas(canvas);
        const ctx = canvas.getContext('2d')!;
        const dx = (CANVAS_SIZE - this.imageWidth) / 2;
        const dy = (CANVAS_SIZE - this.imageHeight) / 2;
        if (img instanceof PixelImage) {
            ctx.putImageData(img.getImageData(), dx, dy);
        } else if (img instanceof HTMLImageElement) {
            ctx.drawImage(img, dx, dy, this.imageWidth, this.imageHeight);
        }
    }
}

const main = () => {
    new Analyser();
};




document.addEventListener("DOMContentLoaded", main);
