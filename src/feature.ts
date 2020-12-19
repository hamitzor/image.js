import { GaussianBlur, Sobel } from './filter';
import { BitmapImage } from './image';

export class Canny {
    run(source: BitmapImage) {
        const { g, theta } = new Sobel().run(new GaussianBlur().run(source));

        const thinnedEdges = source.clone();

        // @TODO: implement the rest of the algorithm.
        for (let i = 2; i < source.rows - 2; i++) {
            for (let j = 2; j < source.cols - 2; j++) {
                let a = 255, b = 255;
                let angle = theta.get(i, j).getChannel(0) * 180 / Math.PI;
                if (angle < 0) {
                    angle += 180;
                }

                if ((0 <= angle && angle < 22.5) || (157.5 <= angle && angle <= 180)) {
                    a = g.get(i, j + 1).getChannel(0);
                    b = g.get(i, j - 1).getChannel(0);
                } else if (22.5 <= angle && angle < 67.5) {
                    a = g.get(i + 1, j + 1).getChannel(0);
                    b = g.get(i - 1, j - 1).getChannel(0);
                } else if (67.5 <= angle && angle < 112.5) {
                    a = g.get(i + 1, j).getChannel(0);
                    b = g.get(i - 1, j).getChannel(0);
                } else if (112.5 <= angle && angle < 157.5) {
                    a = g.get(i - 1, j + 1).getChannel(0);
                    b = g.get(i + 1, j - 1).getChannel(0);
                }

                if (g.get(i, j).getChannel(0) >= a && g.get(i, j).getChannel(0) >= b) {
                    thinnedEdges.get(i, j).update(() => g.get(i, j).getChannel(0));
                } else {
                    thinnedEdges.get(i, j).update(() => 0);
                }
            }
        }

        return thinnedEdges;
    }
}
