import seedrandom from 'seedrandom';

type ImmutableArray<T> = ReadonlyArray<T>;

export interface RandomGenerator {
  readonly nextFloat: () => number;
  readonly nextInt: (min: number, max: number) => number;
  readonly pick: <T>(items: ImmutableArray<T>) => T;
  readonly shuffle: <T>(items: ImmutableArray<T>) => T[];
}

export const createRandomGenerator = (seed: string): RandomGenerator => {
  const random = seedrandom(seed);

  const nextFloat = (): number => {
    return random.quick();
  };

  const nextInt = (min: number, max: number): number => {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);
    const span = upper - lower + 1;
    const value = Math.floor(nextFloat() * span) + lower;
    return value;
  };

  const pick = <T>(items: ImmutableArray<T>): T => {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty collection.');
    }
    const index = nextInt(0, items.length - 1);
    return items[index];
  };

  const shuffle = <T>(items: ImmutableArray<T>): T[] => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = nextInt(0, index);
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
    }
    return copy;
  };

  return { nextFloat, nextInt, pick, shuffle };
};
