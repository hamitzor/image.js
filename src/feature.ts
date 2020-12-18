import { GaussianBlur, Sobel } from "./filter";
import { IntensityImage, RGBImage } from "./image";

export class Canny {
    run(source: IntensityImage | RGBImage) {
        if (source instanceof RGBImage) {
            source = source.toGrayScale();
        }

        const { g, theta } = new Sobel().run(new GaussianBlur().run(source));

        const thinnedEdges = new IntensityImage(source.rows, source.cols, 0);

        // @TODO: implement the rest of the algorithm.
        return thinnedEdges.each((_, i, j) => {
            if (i > 0 && j > 0 && i < thinnedEdges.rows - 1 && j < thinnedEdges.cols - 1) {
                let a = 255, b = 255;
                let angle = theta.get(i, j) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 180;
                }

                if ((0 <= angle && angle < 22.5) || (157.5 <= angle && angle <= 180)) {
                    a = g.get(i, j + 1);
                    b = g.get(i, j - 1);
                } else if (22.5 <= angle && angle < 67.5) {
                    a = g.get(i + 1, j + 1);
                    b = g.get(i - 1, j - 1);
                } else if (67.5 <= angle && angle < 112.5) {
                    a = g.get(i + 1, j);
                    b = g.get(i - 1, j);
                } else if (112.5 <= angle && angle < 157.5) {
                    a = g.get(i - 1, j + 1);
                    b = g.get(i + 1, j - 1);
                }

                if (g.get(i, j) >= a && g.get(i, j) >= b) {
                    return g.get(i, j);
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        });
    }
}
