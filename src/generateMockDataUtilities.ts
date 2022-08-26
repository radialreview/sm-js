import Chance from 'chance';

const chance = new Chance();

export function generateRandomString(): string {
  return chance.word();
}

export function generateRandomBoolean(): boolean {
  return chance.bool();
}

export function generateRandomNumber(min: number, max: number): number {
  return chance.integer({ min, max });
}

export { chance };
