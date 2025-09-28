const seedrandom = require("seedrandom");
const TestSequencerModule = require("@jest/test-sequencer");

const TestSequencerClass = TestSequencerModule.default ?? TestSequencerModule;
const seedVariableName = "TEST_SEED";
const seedFallbackValue = "typeorm-test-db";

const createRandomGenerator = (seed) => {
  const random = seedrandom(seed);
  const nextFloat = () => random.quick();
  const nextInt = (min, max) => {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);
    const span = upper - lower + 1;
    return Math.floor(nextFloat() * span) + lower;
  };
  const shuffle = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = nextInt(0, index);
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
    }
    return copy;
  };
  return { shuffle };
};

class SeededTestSequencer extends TestSequencerClass {
  sort(tests) {
    const seedValue = process.env[seedVariableName] ?? seedFallbackValue;
    const random = createRandomGenerator(seedValue);
    return random.shuffle(tests);
  }
}

module.exports = SeededTestSequencer;
