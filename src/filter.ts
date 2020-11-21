import { Convolution } from "./convolution";
import { Matrix } from "./matrix";
import { PixelImage } from "./pixel-image";

export abstract class Filter {
    abstract filter(source: PixelImage): PixelImage;
}

export class SobelOperator implements Filter {
    filter(source: PixelImage): PixelImage {
        const horizontalKernel = new Matrix([
            [1, 2, 1],
            [0, 0, 0],
            [-1, -2, -1],
        ]);
        const horizontalConv = new Convolution(horizontalKernel);
        const verticalConv = new Convolution(horizontalKernel.transpose());

        const gray = source.makeGrayscale();

        return gray.each((_, x, y) => {
            const gradient = Math.sqrt(
                Math.pow(horizontalConv.apply(gray, x, y).r, 2) + Math.pow(verticalConv.apply(gray, x, y).r, 2)
            );
            return { r: gradient, b: gradient, g: gradient };
        });
    }
}

export class GaussianBlur implements Filter {
    filter(source: PixelImage): PixelImage {
        const conv = new Convolution([
            [1, 4, 7, 4, 1],
            [4, 16, 26, 16, 4],
            [7, 26, 41, 26, 7],
            [4, 16, 26, 16, 4],
            [1, 4, 7, 4, 1]
        ], { normalize: true });
        return source.each((_, x, y) => conv.apply(source, x, y));
    }
}
