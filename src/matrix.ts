function isArrayOfArrays(val: Array<number> | Array<Array<number>>): val is Array<Array<number>> {
    return Array.isArray(val) && Array.isArray(val[0]);
}

export class Matrix {

    protected data: Array<number>;
    public rows: number;
    public cols: number;

    constructor(rows: number, cols: number, fill?: number | Array<number>);
    constructor(data: Array<Array<number>>);
    constructor(arg1: number | Array<Array<number>> | Array<number>, arg2?: number, arg3?: number | Array<number>) {
        if (typeof arg1 === 'number') {
            if (typeof arg2 === 'number') {
                this.rows = arg1;
                this.cols = arg2;
                if (arg3 !== undefined) {
                    if (Array.isArray(arg3)) {
                        this.data = arg3;
                    } else {
                        this.data = new Array(arg1 * arg2);
                        this.data.fill(arg3);
                    }
                } else {
                    this.data = new Array(arg1 * arg2);
                }
            } else {
                throw new Error('Bad parameters for the constructor.');
            }
        } else if (isArrayOfArrays(arg1)) {
            this.cols = arg1.length;
            this.rows = arg1[0].length;
            this.data = arg1.reduce((acc, val) => acc.concat(val), []);
        }
    }

    get(i: number, j: number) {
        return this.data[i * this.cols + j];
    }

    set(i: number, j: number, val: number) {
        this.data[i * this.cols + j] = val;
    }

    toString(): string {
        let str = '';
        str += `Matrix (${this.rows}, ${this.cols}):`;
        for (let i = 0; i < this.rows; i++) {
            str += '\n';
            for (let j = 0; j < this.cols; j++) {
                str += `${this.get(i, j)}\t`;
            }
        }
        return str;
    }

    transpose() {
        const result = Array(this.rows * this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result[j * this.rows + i] = this.get(i, j);
            }
        }
        const rows = this.rows;
        this.rows = this.cols;
        this.cols = rows;
        this.data = result;
        return this;
    }
}