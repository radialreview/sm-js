import { SMPlugin } from "./plugins";

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