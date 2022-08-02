var Chance = require('chance');

export function generateRandomString(): string {
  const chance = new Chance();
  return chance.word();
}

export function generateRandomBoolean(): boolean {
  const chance = new Chance();
  return chance.bool();
}

export function generateRandomNumber(min: number, max: number): number {
  const chance = new Chance();
  return chance.integer({ min, max });
}
