import { DOFactory } from './DO';
import {
  SMDataTypeException,
  SMDataTypeExplicitDefaultException,
} from './exceptions';
import * as smData from './smDataTypes';

describe('Node default properties', () => {
  it('should handle defaults/optional properties for string types', () => {
    const properties = {
      firstName: smData.string('Joe'),
      lastName: smData.string,
      nickname: smData.string('Joey'),
      address: smData.string.optional,
      description: smData.string.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      nickname: 'Joseph',
      description: 'is a cool guy',
    });

    expect(DO.firstName).toEqual('Joe');
    expect(DO.lastName).toEqual('');
    expect(DO.nickname).toEqual('Joseph');
    expect(DO.address).toStrictEqual(null);
    expect(DO.description).toEqual('is a cool guy');
  });

  it('should handle defaults/optional properties for number types', () => {
    const properties = {
      price: smData.number(123.15),
      taxRate: smData.number,
      credits: smData.number(5),
      total: smData.number.optional,
      subTotal: smData.number.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      credits: '40',
      subTotal: '30',
    });

    expect(DO.price).toEqual(123.15);
    expect(DO.taxRate).toEqual(0);
    expect(DO.credits).toEqual(40);
    expect(DO.total).toEqual(null);
    expect(DO.subTotal).toEqual(30);
  });

  it('should handle defaults/optional properties for boolean types', () => {
    const properties = {
      isLoggingEnabled: smData.boolean(true),
      isBillingEnabled: smData.boolean(false),
      isAdminEnabled: smData.boolean.optional,
      isProduction: smData.boolean.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      isBillingEnabled: 'true',
      isProduction: 'false',
    });

    expect(DO.isLoggingEnabled).toEqual(true);
    expect(DO.isBillingEnabled).toEqual(true);
    expect(DO.isAdminEnabled).toEqual(null);
    expect(DO.isProduction).toEqual(false);
  });

  it('should throw an error if no explicit default is set', () => {
    const properties = {
      isLoggingEnabled: smData.boolean(true),
      isBillingEnabled: smData.boolean,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    try {
      new DOClass({
        isLoggingEnabled: true,
      });
    } catch (e) {
      expect(e instanceof SMDataTypeExplicitDefaultException).toEqual(true);
    }
  });

  it('should throw an error if a number is passed an invalid default', () => {
    const properties = {
      firstNumber: smData.number(42),
      invalidNumber: smData.number,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    try {
      new DOClass({
        invalidNumber: 'hello',
      });
    } catch (e) {
      expect(e instanceof SMDataTypeException).toEqual(true);
    }
  });

  it('should handle defaults/optional properties for array types', () => {
    const properties = {
      pets: smData.array(smData.string)(['cat', 'dog', 'bird']),
      dogBreeds: smData.array(smData.string)(['pug', 'golden retriever']),
      catBreeds: smData.array(smData.string),
      insects: smData.array(smData.string),
      birdBreeds: smData.array(smData.string).optional,
      petsInStock: smData.array(
        smData.object({
          name: smData.string,
          type: smData.string('n/a'),
          onSale: smData.boolean(true),
        })
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      dogBreeds: ['husky'],
      catBreeds: ['siamese'],
      petsInStock: [
        {
          name: 'floyd',
        },
        { name: 'harry', type: 'cat' },
      ],
    });

    expect(DO.pets).toEqual(['cat', 'dog', 'bird']);
    expect(DO.dogBreeds).toEqual(['husky']);
    expect(DO.catBreeds).toEqual(['siamese']);
    expect(DO.birdBreeds).toEqual(null);
    expect(DO.insects).toEqual(['']);
    expect(DO.petsInStock).toEqual([
      {
        name: 'floyd',
        type: 'n/a',
        onSale: true,
      },
      { name: 'harry', type: 'cat', onSale: true },
    ]);
  });

  it('should handle defaults/optional properties for object types', () => {
    const properties = {
      zoo: smData.string,
      animal: smData.object.optional({
        type: smData.string('cat'),
        name: smData.string('joe'),
        age: smData.number,
        isGoodBoy: smData.boolean.optional,
        favoriteFoods: smData.array(smData.string).optional,

        owner: smData.object({ name: smData.string('rick') }),
        bestFriend: smData.object.optional({ name: smData.string }),
        favoriteNumbers: smData.array(smData.number),
        leastFavoriteNumbers: smData.array(smData.number).optional,
      }),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      zoo: 'brendans zoo',
      animal: {
        type: 'dog',
        isGoodBoy: 'true',
        favoriteNumbers: null,
        leastFavoriteNumbers: ['2', '5'],
      },
    });

    expect(DO.animal.type).toEqual('dog');
    expect(DO.animal.name).toEqual('joe');
    expect(DO.animal.age).toEqual(0);
    expect(DO.animal.isGoodBoy).toEqual(true);
    expect(DO.animal.favoriteFoods).toEqual(null);
    expect(DO.animal.owner.name).toEqual('rick');
    expect(DO.animal.bestFriend).toEqual(null);
    expect(DO.animal.favoriteNumbers).toEqual([0]);
    expect(DO.animal.leastFavoriteNumbers).toEqual([2, 5]);
  });

  it('should handle defaults/optional properties for record types (string values)', () => {
    const properties = {
      person: smData.record.optional(smData.string),
      animal: smData.record.optional(smData.string),
      other: smData.record(smData.string('John')),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      person: {
        name: 'Joe',
        occupation: 'plumber',
      },
      other: {
        name: undefined,
      },
    });

    expect(DO.person.name).toEqual('Joe');
    expect(DO.person.occupation).toEqual('plumber');
    expect(DO.animal).toEqual(null);
    expect(DO.other).toEqual({ name: 'John' });
  });

  it('should handle defaults/optional properties for record types (number values)', () => {
    const properties = {
      productName: smData.string,
      cost: smData.record(smData.number),
      test: smData.record(smData.array(smData.string)),
      secretPrice: smData.record(smData.number(100)),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      productName: 'guitar',
      cost: {
        subtotal: '500',
        tax: '12.5',
        total: '512.5',
      },
      secretPrice: {
        hidden: undefined,
      },
    });

    console.error = jest.fn();

    expect(DO.productName).toEqual('guitar');
    expect(DO.cost.subtotal).toEqual(500);
    expect(DO.cost.tax).toEqual(12.5);
    expect(DO.cost.total).toEqual(512.5);
    expect(DO.secretPrice.hidden).toEqual(100);
  });

  it('should handle defaults/optional properties for record types (boolean values)', () => {
    const properties = {
      todos: smData.record(smData.boolean(false)),
      featureFlags: smData.record(smData.boolean(true)),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      todos: {
        hasTestedSmDataTypes: 'true',
      },
      featureFlags: {
        enableBilling: undefined,
      },
    });

    expect(DO.todos.hasTestedSmDataTypes).toEqual(true);
    expect(DO.featureFlags.enableBilling).toEqual(true);
  });

  it('should handle defaults/optional properties for record types (array values)', () => {
    const properties = {
      numbers: smData.record(smData.array(smData.number)),
      people: smData.record(
        smData.array(
          smData.object({
            name: smData.string,
            age: smData.number,
            occupation: smData.string('plumber'),
          })
        )
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      numbers: {
        favorite: [1, 2, 3],
      },
      people: {
        plumbers: [
          { name: 'Joe', age: '42' },
          { name: 'Jane', age: '35' },
        ],
      },
    });

    expect(DO.numbers.favorite).toEqual([1, 2, 3]);
    expect(DO.people.plumbers).toEqual([
      { name: 'Joe', age: 42, occupation: 'plumber' },
      { name: 'Jane', age: 35, occupation: 'plumber' },
    ]);
  });

  it('should handle defaults/optional properties for record types (object values)', () => {
    const properties = {
      peopleById: smData.record(
        smData.object({
          name: smData.string,
          age: smData.number,
          occupation: smData.string('plumber'),
        })
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def);

    const DO = new DOClass({
      peopleById: {
        123: {
          name: 'joe',
          age: '50',
        },
      },
    });

    expect(DO.peopleById['123'].name).toEqual('joe');

    expect(DO.peopleById['123'].age).toEqual(50);

    expect(DO.peopleById['123'].occupation).toEqual('plumber');
  });
});
