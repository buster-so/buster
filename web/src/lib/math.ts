export class JsonDataFrameOperationsSingle {
  private data: Record<string, any>[];
  private column: string;

  constructor(data: Record<string, any>[], column: string) {
    if (!Array.isArray(data)) {
      throw new Error('Data should be an array.');
    }
    if (typeof column !== 'string') {
      throw new Error('Column should be a string.');
    }
    this.data = data;
    this.column = column;
  }

  first(): number {
    return this.data[0]?.[this.column];
  }

  // Method to count the number of entries in the specified column
  count(): number {
    return this.data.reduce((acc, item) => (item[this.column] !== undefined ? acc + 1 : acc), 0);
  }

  // Method to calculate the sum of a specified column
  sum(): number {
    return this.data.reduce((acc, item) => {
      const value = Number(item[this.column]);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
  }

  // Method to calculate the average of a specified column
  average(): number {
    const validEntries = this.data.filter((item) => !isNaN(Number.parseFloat(item[this.column])));
    return validEntries.length === 0 ? 0 : this.sum() / validEntries.length;
  }

  // Method to get the minimum value in the specified column
  min(): number {
    return Math.min(
      ...this.data.map((item) => Number.parseFloat(item[this.column])).filter((value) => !isNaN(value))
    );
  }

  // Method to get the maximum value in the specified column
  max(): number {
    return Math.max(
      ...this.data.map((item) => Number.parseFloat(item[this.column])).filter((value) => !isNaN(value))
    );
  }

  median(): number {
    const sortedValues = this.data
      .map((item) => Number.parseFloat(item[this.column]))
      .filter((value) => !isNaN(value))
      .sort((a, b) => a - b);
    const middle = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 !== 0
      ? sortedValues[middle]
      : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }

  custom(): number {
    return 0;
  }

  // Method to filter data based on a condition in the specified column
  filterByCondition(conditionFn: (value: any) => boolean): Record<string, any>[] {
    return this.data.filter((item) => conditionFn(item[this.column]));
  }
}

export class DataFrameOperations {
  private data: [...(number | string)[]][];
  private columnIndex: number;

  constructor(data: [...(number | string)[]][], columnIndex = 1) {
    if (!Array.isArray(data)) {
      throw new Error('Data should be an array.');
    }
    this.data = data;
    this.columnIndex = columnIndex;
  }

  first(): number {
    return this.data[0]?.[this.columnIndex] as number;
  }

  current(): number {
    return this.data[this.data.length - 1]?.[this.columnIndex] as number;
  }

  last(): number {
    return this.data[this.data.length - 1]?.[this.columnIndex] as number;
  }

  count(): number {
    return this.data.length;
  }

  sum(): number {
    return this.data.reduce((acc, item) => {
      const value = item[this.columnIndex];
      return acc + (isNaN(value as number) ? 0 : Number(value));
    }, 0);
  }

  average(): number {
    const validEntries = this.data.filter((item) => !isNaN(item[this.columnIndex] as number));
    return validEntries.length === 0 ? 0 : this.sum() / validEntries.length;
  }

  min(): number {
    return Math.min(
      ...this.data.map((item) => Number(item[this.columnIndex])).filter((value) => !isNaN(value))
    );
  }

  max(): number {
    return Math.max(
      ...this.data.map((item) => Number(item[this.columnIndex])).filter((value) => !isNaN(value))
    );
  }

  median(): number {
    const sortedValues = this.data
      .map((item) => Number(item[this.columnIndex]))
      .filter((value) => !isNaN(value))
      .sort((a, b) => a - b);

    const middle = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 !== 0
      ? sortedValues[middle]
      : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }
}

export class ArrayOperations {
  private data: number[] | string[] | (number | string)[];

  constructor(data: number[] | string[] | (number | string)[]) {
    this.data = data;
  }

  first(): number {
    return this.data[0] as number;
  }

  last(): number {
    return this.data[this.data.length - 1] as number;
  }

  current(): number {
    return this.data[this.data.length - 1] as number;
  }

  count(): number {
    return this.data.length;
  }

  sum(): number {
    return this.data.reduce<number>((acc, item) => {
      const value = Number(item);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);
  }

  total(): number {
    return this.sum();
  }

  average(): number {
    const validEntries = this.data.filter((item) => !isNaN(item as number));
    return validEntries.length === 0 ? 0 : this.sum() / validEntries.length;
  }

  min(): number {
    return Math.min(...this.data.map((item) => Number(item)).filter((value) => !isNaN(value)));
  }

  max(): number {
    return Math.max(...this.data.map((item) => Number(item)).filter((value) => !isNaN(value)));
  }

  median(): number {
    const sortedValues = this.data
      .map((item) => Number(item))
      .filter((value) => !isNaN(value))
      .sort((a, b) => a - b);

    const middle = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 !== 0
      ? sortedValues[middle]
      : (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }
}
