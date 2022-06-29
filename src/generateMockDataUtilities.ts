var Chance = require('chance');

export function generateRandomString() {
  const chance = new Chance();
  return chance.word();
}

export function generateRandomBoolean() {
  const chance = new Chance();
  return chance.bool();
}

export function generateRandomNumber(min: number, max: number) {
  const chance = new Chance();
  return chance.integer({ min, max });
}
