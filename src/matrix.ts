export class Matrix {

    public width: number;
    public height: number;

    constructor(public data: Array<Array<number>>) {
        this.height = data.length;
        if (data.length) {
            this.width = data[0].length;
        }
    }

    transpose() {
        const result = new Array<Array<number>>();
        for (let i = 0; i < this.width; i++) {
            result.push([]);
            for (let j = 0; j < this.height; j++) {
                result[i].push(this.data[j][i]);
            }
        }
        return new Matrix(result);
    }
}