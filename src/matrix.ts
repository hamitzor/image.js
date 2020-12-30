function isArrayOfArrays<T>(val: Array<T> | Array<Array<T>>): val is Array<Array<T>> {
    return Array.isArray(val) && Array.isArray(val[0]);
}

/**
 * Represents a matrix whose values are of type T.
 */
export class Matrix<T> {

    /**
     * A 1-D array that contains the elements in the matrix consecutively.
     */
    protected data: Array<T>;

    /**
     * The height of the matrix.
     */
    public rows: number;

    /**
     * The width of the matrix.
     */
    public cols: number;

    /**
     * Create a matrix with dimension information.
     * @param rows - Height of the matrix
     * @param cols - Width of the matrix
     * @param fill - A single value to fill the matrix, or an array that contains the elements consecutively.
     */
    constructor(rows: number, cols: number, fill?: T | Array<T>);

    /**
     * Create a from native 2-D array.
     * @param data - A 2-D array represents the matrix.
     */
    constructor(data: Array<Array<T>>);

    constructor(arg1: number | Array<Array<T>> | Array<T>, arg2?: number, arg3?: T | Array<T>) {
        if (typeof arg1 === 'number') {
            if (typeof arg2 === 'number') {
                this.rows = arg1;
                this.cols = arg2;
                this.data = Array.isArray(arg3) ? arg3 : new Array(arg1 * arg2).fill(arg3);
            } else {
                throw new Error('Bad parameters for the constructor.');
            }
        } else if (isArrayOfArrays(arg1)) {
            this.cols = arg1.length;
            this.rows = arg1[0].length;
            this.data = arg1.reduce((acc, val) => acc.concat(val), []);
        }
    }

    /**
     * Get the value at (i,j)
     * @param i - Row number.
     * @param j - Column number.
     * @returns Value at (i, j)
     */
    get(i: number, j: number): T {
        return this.data[i * this.cols + j];
    }

    /**
     * Set the value at (i,j)
     * @param i - Row number.
     * @param j - Column number.
     * @param val - New value
     */
    set(i: number, j: number, val: T) {
        this.data[i * this.cols + j] = val;
    }

    /**
     * Get a string representation of the matrix that can be used for debugging.
     * @returns String representation of the matrix.
     */
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

    /**
     * Transpose the matrix. This method mutates the original matrix.
     * @returns this
     */
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
