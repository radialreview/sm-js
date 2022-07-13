import { getDefaultConfig, MMGQL } from '.';
import {
  DataTypeException,
  DataTypeExplicitDefaultException,
} from './exceptions';
import * as data from './dataTypes';

describe('Node default properties', () => {
  it('should handle defaults/optional properties for string types', () => {
    const properties = {
      firstName: data.string('Joe'),
      lastName: data.string,
      nickname: data.string('Joey'),
      address: data.string.optional,
      description: data.string.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      price: data.number(123.15),
      taxRate: data.number,
      credits: data.number(5),
      total: data.number.optional,
      subTotal: data.number.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      isLoggingEnabled: data.boolean(true),
      isBillingEnabled: data.boolean(false),
      isAdminEnabled: data.boolean.optional,
      isProduction: data.boolean.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      isLoggingEnabled: data.boolean(true),
      isBillingEnabled: data.boolean,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

    try {
      new DOClass({
        isLoggingEnabled: true,
      });
    } catch (e) {
      expect(e instanceof DataTypeExplicitDefaultException).toEqual(true);
    }
  });

  it('should throw an error if a number is passed an invalid default', () => {
    const properties = {
      firstNumber: data.number(42),
      invalidNumber: data.number,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

    try {
      new DOClass({
        invalidNumber: 'hello',
      });
    } catch (e) {
      expect(e instanceof DataTypeException).toEqual(true);
    }
  });

  it('should handle defaults/optional properties for array types', () => {
    const properties = {
      pets: data.array(data.string)(['cat', 'dog', 'bird']),
      dogBreeds: data.array(data.string)(['pug', 'golden retriever']),
      catBreeds: data.array(data.string),
      insects: data.array(data.string),
      birdBreeds: data.array(data.string).optional,
      petsInStock: data.array(
        data.object({
          name: data.string,
          type: data.string('n/a'),
          onSale: data.boolean(true),
        })
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      zoo: data.string,
      animal: data.object.optional({
        type: data.string('cat'),
        name: data.string('joe'),
        age: data.number,
        isGoodBoy: data.boolean.optional,
        favoriteFoods: data.array(data.string).optional,

        owner: data.object({ name: data.string('rick') }),
        bestFriend: data.object.optional({ name: data.string }),
        favoriteNumbers: data.array(data.number),
        leastFavoriteNumbers: data.array(data.number).optional,
      }),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      person: data.record.optional(data.string),
      animal: data.record.optional(data.string),
      other: data.record(data.string('John')),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      productName: data.string,
      cost: data.record(data.number),
      test: data.record(data.array(data.string)),
      secretPrice: data.record(data.number(100)),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      todos: data.record(data.boolean(false)),
      featureFlags: data.record(data.boolean(true)),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

    const DO = new DOClass({
      todos: {
        hasTestedDataTypes: 'true',
      },
      featureFlags: {
        enableBilling: undefined,
      },
    });

    expect(DO.todos.hasTestedDataTypes).toEqual(true);
    expect(DO.featureFlags.enableBilling).toEqual(true);
  });

  it('should handle defaults/optional properties for record types (array values)', () => {
    const properties = {
      numbers: data.record(data.array(data.number)),
      people: data.record(
        data.array(
          data.object({
            name: data.string,
            age: data.number,
            occupation: data.string('plumber'),
          })
        )
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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
      peopleById: data.record(
        data.object({
          name: data.string,
          age: data.number,
          occupation: data.string('plumber'),
        })
      ),
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

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

  it('defines default node properties', () => {
    const properties = {
      custom: data.string,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = new MMGQL(getDefaultConfig()).def(def).do;

    const DO = new DOClass({
      id: 'joe',
    });

    expect(DO.dateLastModified);
  });
});
