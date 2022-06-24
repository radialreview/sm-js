export const mockStrings = [
  'Billy',
  'Nancy',
  'Max',
  'Will',
  'Dustin',
  'Jim',
  'Eleven',
  'Mike',
  'Steve',
  'Robin',
  'Jonathan',
  'Barbara',
  'Erica',
  'Lucas',
  'Vecna',
  'Demogorgon',
  'Dart',
  'Hawkins',
  'Indiana',
];

export function generateRandomString() {
  return mockStrings[Math.floor(Math.random() * mockStrings.length)];
}

export function generateRandomBoolean() {
  const bools = [true, false];
  return bools[Math.floor(Math.random() * bools.length)];
}

export function generateRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
