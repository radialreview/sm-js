import { computed, makeAutoObservable } from 'mobx';
import { Plugin } from './types';

export const mobxPlugin: Plugin = {
  DO: {
    onConstruct: ({ DOInstance, parsedDataKey }) => {
      makeAutoObservable(DOInstance[parsedDataKey]);
    },
    computedDecorator: ({ DOInstance, computedFn }) => {
      return computed(() => computedFn(DOInstance)).get;
    },
  },
  DOProxy: {
    computedDecorator: ({ ProxyInstance, computedFn }) => {
      return computed(() => computedFn(ProxyInstance)).get;
    },
  },
  QMResults: {
    onConstruct: ({ queryResults }) => {
      makeAutoObservable(queryResults);
    },
  },
};
