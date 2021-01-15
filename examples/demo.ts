import { Bitmap, Drawable } from '../src/image';
import { GaussianBlur, Sobel, BasicFilter } from '../src/filter';
import { Canny } from '../src/feature';
import { KMeansSegmentation } from '../src/segmentation';
import { random } from '../src/util';

const CANVAS_SIZE = 800;

class DemoApp {

    ELS = {
        app: document.getElementById('app') as HTMLDivElement,
        overlay: document.getElementById('overlay') as HTMLDivElement,
        input: document.getElementById('input') as HTMLCanvasElement,
        imageInput: document.getElementById('imageInput') as HTMLInputElement,
        loadImage: document.getElementById('loadImage') as HTMLButtonElement,
        loadImage2: document.getElementById('loadImage2') as HTMLButtonElement,
        undo: document.getElementById('undo') as HTMLButtonElement,
        redo: document.getElementById('redo') as HTMLButtonElement,
        grayscale: document.getElementById('grayscale') as HTMLButtonElement,
        sobel: document.getElementById('sobel') as HTMLButtonElement,
        popups: {
            kernel: {
                open: document.getElementById('kernelOpen') as HTMLButtonElement,
                popup: document.getElementById('kernelPopup') as HTMLDivElement,
                size: document.getElementById('kernelOptionsSize') as HTMLInputElement,
                matrix: document.getElementById('kernelOptionsMatrix') as HTMLDivElement,
                apply: document.getElementById('kernelApply') as HTMLButtonElement,
                cancel: document.getElementById('kernelCancel') as HTMLButtonElement,
                error: document.getElementById('kernelError') as HTMLDivElement,
                transpose: document.getElementById('kernelTranspose') as HTMLButtonElement
            },
            gauss: {
                open: document.getElementById('gaussOpen') as HTMLButtonElement,
                popup: document.getElementById('gaussPopup') as HTMLDivElement,
                size: document.getElementById('gaussSize') as HTMLInputElement,
                sigma: document.getElementById('gaussSigma') as HTMLInputElement,
                apply: document.getElementById('gaussApply') as HTMLButtonElement,
                cancel: document.getElementById('gaussCancel') as HTMLButtonElement,
                error: document.getElementById('gaussError') as HTMLDivElement
            },
            canny: {
                open: document.getElementById('cannyOpen') as HTMLButtonElement,
                popup: document.getElementById('cannyPopup') as HTMLDivElement,
                low: document.getElementById('cannyLow') as HTMLInputElement,
                high: document.getElementById('cannyHigh') as HTMLInputElement,
                size: document.getElementById('cannyGaussSize') as HTMLInputElement,
                sigma: document.getElementById('cannyGaussSigma') as HTMLInputElement,
                apply: document.getElementById('cannyApply') as HTMLButtonElement,
                cancel: document.getElementById('cannyCancel') as HTMLButtonElement,
                error: document.getElementById('cannyError') as HTMLDivElement
            },
            segment: {
                open: document.getElementById('segmentOpen') as HTMLButtonElement,
                popup: document.getElementById('segmentPopup') as HTMLDivElement,
                number: document.getElementById('segmentNumber') as HTMLInputElement,
                rgb: document.getElementById('segmentRGB') as HTMLInputElement,
                intensity: document.getElementById('segmentIntensity') as HTMLInputElement,
                apply: document.getElementById('segmentApply') as HTMLButtonElement,
                cancel: document.getElementById('segmentCancel') as HTMLButtonElement,
                error: document.getElementById('segmentError') as HTMLDivElement
            },
            compress: {
                open: document.getElementById('compressOpen') as HTMLButtonElement,
                popup: document.getElementById('compressPopup') as HTMLDivElement,
                depth: document.getElementById('compressDepth') as HTMLInputElement,
                apply: document.getElementById('compressApply') as HTMLButtonElement,
                cancel: document.getElementById('compressCancel') as HTMLButtonElement,
                error: document.getElementById('compressError') as HTMLDivElement
            }
        }
    };

    imageWidth: number;
    imageHeight: number;

    kernel: {
        size: number;
        matrix: BasicFilter;
    };

    gauss = new GaussianBlur();

    canny = new Canny();

    segmentation = new KMeansSegmentation();

    compression = new KMeansSegmentation();

    history: Bitmap[] = [];
    historyIndex: number;

    private createElement(html: string): ChildNode {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild!;
    }

    private show(el: HTMLElement) {
        el?.classList.remove('hidden');
    }

    private hide(el: HTMLElement) {
        el?.classList.add('hidden');
    }

    private showPopup(el: HTMLElement) {
        this.show(el);
        this.show(this.ELS.overlay);
    }

    private hidePopup(el: HTMLElement) {
        this.hide(el);
        this.hide(this.ELS.overlay);
    }

    constructor() {

        this.hide(this.ELS.overlay);

        Object.keys(this.ELS.popups).forEach(name => {
            const els = (this.ELS.popups as any)[name] as { [key: string]: HTMLElement };
            this.hide(els.popup);
            this.hide(els.error);
            els.open.onclick = () => this.showPopup(els.popup);
            els.cancel.onclick = () => this.hidePopup(els.popup);
        });

        this.ELS.undo.onclick = () => this.undo();
        this.ELS.redo.onclick = () => this.redo();

        document.addEventListener('keydown', event => {
            if (event.ctrlKey && event.key === 'z') {
                this.undo();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.ctrlKey && event.key === 'y') {
                this.redo();
            }
        });

        this.ELS.grayscale.onclick = () => {
            this.do(() => this.renderImage(this.ELS.input, Bitmap.fromImageData(this.getImageData(this.ELS.input))));
        };

        const onGaussChange = () => {
            try {
                this.hide(this.ELS.popups.gauss.error);
                const size = parseInt(this.ELS.popups.gauss.size.value, 10);
                const sigma = parseFloat(this.ELS.popups.gauss.sigma.value);
                this.gauss.setOpts({ sigma, n: size });
            } catch (err: any) {
                this.ELS.popups.gauss.error.innerText = err;
                this.show(this.ELS.popups.gauss.error);
            }
        };

        const onCannyChange = () => {
            try {
                this.hide(this.ELS.popups.canny.error);
                const size = parseInt(this.ELS.popups.canny.size.value, 10);
                const sigma = parseFloat(this.ELS.popups.canny.sigma.value);
                const low = parseFloat(this.ELS.popups.canny.low.value);
                const high = parseFloat(this.ELS.popups.canny.high.value);
                this.canny.setOpts({
                    lowThresholdRatio: low,
                    highThresholdRatio: high,
                    gaussianBlurOpts: {
                        n: size,
                        sigma
                    }
                });
            } catch (err: any) {
                this.ELS.popups.canny.error.innerText = err;
                this.show(this.ELS.popups.canny.error);
            }
        };

        const onSegmentChange = () => {
            try {
                this.hide(this.ELS.popups.segment.error);
                const number = parseInt(this.ELS.popups.segment.number.value, 10);

                if (typeof number !== 'number' || !Number.isInteger(number)) {
                    throw new Error('Segment number should be an integer.');
                }

                const rgb = this.ELS.popups.segment.rgb.checked;
                this.segmentation.setOpts({
                    colors: Array.from({ length: number }, () => [random(255, 10), random(255, 10), random(255, 10)]),
                    byIntensity: !rgb
                });
            } catch (err: any) {
                this.ELS.popups.segment.error.innerText = err;
                this.show(this.ELS.popups.segment.error);
            }
        };

        const onCompressChange = () => {
            try {
                this.hide(this.ELS.popups.compress.error);
                const depth = parseInt(this.ELS.popups.compress.depth.value, 10);

                if (typeof depth !== 'number' || !Number.isInteger(depth)) {
                    throw new Error('Color depth should be an integer.');
                }
                this.compression.setOpts({
                    colors: Math.pow(2, depth),
                });
            } catch (err: any) {
                this.ELS.popups.compress.error.innerText = err;
                this.show(this.ELS.popups.compress.error);
            }
        };

        this.ELS.popups.compress.depth.onkeyup = onCompressChange;

        this.ELS.popups.segment.number.onkeyup = onSegmentChange;
        this.ELS.popups.segment.rgb.onchange = onSegmentChange;
        this.ELS.popups.segment.intensity.onchange = onSegmentChange;

        this.ELS.popups.canny.sigma.onkeyup = onCannyChange;
        this.ELS.popups.canny.size.onkeyup = onCannyChange;
        this.ELS.popups.canny.low.onkeyup = onCannyChange;
        this.ELS.popups.canny.high.onkeyup = onCannyChange;

        this.ELS.popups.gauss.sigma.onkeyup = onGaussChange;
        this.ELS.popups.gauss.size.onkeyup = onGaussChange;

        this.ELS.popups.kernel.transpose.onclick = () => {
            this.kernel.matrix.transpose();
            for (let i = 0; i < this.kernel.size; i++) {
                for (let j = 0; j < this.kernel.size; j++) {
                    const el = document.getElementById(`kernelCell_${i}_${j}`) as HTMLInputElement;
                    el.value = '' + this.kernel.matrix.get(i, j);
                }
            }
        };

        this.ELS.popups.kernel.size.onkeyup = () => {
            this.hide(this.ELS.popups.kernel.error);
            const size = parseInt(this.ELS.popups.kernel.size.value, 10);
            if (typeof size !== 'number' || size % 2 === 0 || size < 3) {
                this.ELS.popups.kernel.error.innerText = 'Kernel size should be an odd number greater than 3.';
                this.show(this.ELS.popups.kernel.error);
                return;
            }

            const matrix = new BasicFilter(size, size, 0);

            matrix.set((size - 1) / 2, (size - 1) / 2, 1);

            this.kernel = {
                matrix,
                size
            };

            this.ELS.popups.kernel.matrix.innerHTML = '';
            for (let i = 0; i < size; i++) {
                this.ELS.popups.kernel.matrix.appendChild(
                    this.createElement(`
                <div class="d-flex">
                    ${new Array(size).fill(undefined).map((_, j) =>
                        `<div>
                            <input id="kernelCell_${i}_${j}" type="text" class="form-control text-center" onchange="" value="${matrix.get(i, j)}">
                        </div>`
                    ).join('')}
                </div>
            `));
            }

            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    const el = document.getElementById(`kernelCell_${i}_${j}`) as HTMLInputElement;
                    if (el) {
                        el.onchange = () => {
                            matrix.set(i, j, parseFloat(el.value));
                        };
                    }
                }
            }
        };

        this.ELS.popups.compress.apply.onclick = () => {
            this.hidePopup(this.ELS.popups.compress.popup);
            this.compression.run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(result => this.do(() => this.renderImage(this.ELS.input, result)))
                .catch(err => alert(err));
        };

        this.ELS.popups.segment.apply.onclick = () => {
            this.hidePopup(this.ELS.popups.segment.popup);
            onSegmentChange();
            this.segmentation.run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(result => this.do(() => this.renderImage(this.ELS.input, result)))
                .catch(err => alert(err));
        };

        this.ELS.popups.kernel.apply.onclick = () => {
            this.hidePopup(this.ELS.popups.kernel.popup);
            this.kernel.matrix.run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(result => this.do(() => this.renderImage(this.ELS.input, result)))
                .catch(err => alert(err));
        };

        this.ELS.popups.gauss.apply.onclick = () => {
            this.hidePopup(this.ELS.popups.gauss.popup);

            this.gauss.run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(result => this.do(() => this.renderImage(this.ELS.input, result)))
                .catch(err => alert(err));
        };

        this.ELS.sobel.onclick = () => {
            this.hidePopup(this.ELS.popups.gauss.popup);
            new Sobel().run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(({ g }) => this.do(() => this.renderImage(this.ELS.input, g)))
                .catch(err => alert(err));
        };

        this.ELS.popups.canny.apply.onclick = () => {
            this.hidePopup(this.ELS.popups.canny.popup);

            this.canny.run(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3))
                .then(result => this.do(() => this.renderImage(this.ELS.input, result)))
                .catch(err => alert(err));
        };

        this.ELS.popups.kernel.size.dispatchEvent(new Event('keyup'));
        this.ELS.popups.gauss.size.dispatchEvent(new Event('keyup'));
        this.ELS.popups.segment.number.dispatchEvent(new Event('keyup'));
        this.ELS.popups.compress.depth.dispatchEvent(new Event('keyup'));

        [this.ELS.input].forEach(canvas => {
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            canvas.onwheel = e => {
                canvas.getContext('2d')?.scale(2, 2);
            };
            this.clearCanvas(canvas);
        });

        this.ELS.loadImage.onclick = () => this.ELS.imageInput.click();
        this.ELS.loadImage2.onclick = () => this.ELS.imageInput.click();

        this.ELS.imageInput.onchange = () => {
            this.ELS.grayscale.disabled = false;
            this.ELS.sobel.disabled = false;
            this.ELS.loadImage2.style.display = 'none';
            Object.keys(this.ELS.popups).forEach(name => {
                const els = (this.ELS.popups as any)[name] as { [key: string]: HTMLElement };
                (els.open as HTMLButtonElement).disabled = false;
            });

            const file = this.ELS.imageInput.files?.[0];
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
                    this.renderImage(this.ELS.input, img);
                    this.history = [Bitmap.fromImageData(this.getImageData(this.ELS.input), 3)];
                    this.historyIndex = 0;
                    this.ELS.imageInput.value = '';
                };
            };
        };
    }

    private do(cb: () => void) {
        if (this.historyIndex !== this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        cb();
        this.history.push(Bitmap.fromImageData(this.getImageData(this.ELS.input), 3));
        this.historyIndex++;
        this.ELS.redo.disabled = true;
        this.ELS.undo.disabled = false;
    }

    private undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.renderImage(this.ELS.input, this.history[this.historyIndex]);
            if (this.historyIndex < 1) {
                this.ELS.undo.disabled = true;
            }
            if (this.historyIndex < this.history.length - 1) {
                this.ELS.redo.disabled = false;
            }
        } else {
            new Audio('/public/alert.mp3').play();
        }
    }

    private redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.renderImage(this.ELS.input, this.history[this.historyIndex]);
            if (this.historyIndex === this.history.length - 1) {
                this.ELS.redo.disabled = true;
            }
            if (this.historyIndex > 0) {
                this.ELS.undo.disabled = false;
            }
        } else {
            new Audio('/alert.mp3').play();
        }
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
    const demo = new DemoApp();
    (window as any).app = demo;
};

document.addEventListener('DOMContentLoaded', main);
