import { computed, extendObservable, makeAutoObservable, action } from 'mobx';
import { Plugin } from './types';
import { computedFn as computedFnMobx } from 'mobx-utils';

export const mobxPlugin: Plugin = {
  DO: {
    onConstruct: ({ DOInstance, parsedDataKey }) => {
      makeAutoObservable(DOInstance[parsedDataKey]);
    },
    onExtendObservable: ({ DOInstance, objectToExtend }) => {
      extendObservable(DOInstance, objectToExtend);
    },
    onExtendComputedObservable: ({ DOInstance, propName, computedFn }) => {
      extendObservable(DOInstance, {
        get [propName]() {
          return computed(() => computedFn(DOInstance)).get();
        },
      });
    },
    actionDecorator: ({ actionFn }) => {
      return action(actionFn);
    },
  },
  DOProxy: {
    computedDecorator: ({ computedFn }) => {
      return computedFnMobx(computedFn);
    },
  },
  QMResults: {
    onConstruct: ({ queryResults }) => {
      makeAutoObservable(queryResults);
    },
  },
};
