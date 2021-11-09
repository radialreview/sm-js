import { SMPlugin } from "./plugins";
import {
  ApolloClient,
  InMemoryCache,

} from '@apollo/client';

const defaultClien

export type SMConfig = {
    plugins?: Array<SMPlugin>
}

let _storedConfig: SMConfig = {

}

export function config(config: SMConfig) {
    _storedConfig = config
}

export function getConfig() {
    return _storedConfig
}