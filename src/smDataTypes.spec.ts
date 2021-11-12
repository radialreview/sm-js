import { DOFactory } from './DO';
import { SMDataTypeExplicitDefaultException } from './exceptions';
// import { SMDataTypeExplicitDefaultException } from './exceptions';
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

    const DOClass = DOFactory(def as any);

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
      total: smData.string.optional,
      subTotal: smData.string.optional,
    };

    const def = {
      type: 'mockNodeType',
      properties,
    };

    const DOClass = DOFactory(def as any);

    const DO = new DOClass({
      credits: 40,
      subTotal: 30,
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

    const DOClass = DOFactory(def as any);

    const DO = new DOClass({
      isBillingEnabled: true,
      isProduction: false,
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

    const DOClass = DOFactory(def as any);

    try {
      new DOClass({
        isLoggingEnabled: true,
      });
    } catch (e) {
      expect(e instanceof SMDataTypeExplicitDefaultException).toEqual(true);
    }
  });
});
