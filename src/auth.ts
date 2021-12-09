import { clearObject } from './dataUtilities';

const tokens: Record<string, string> = {};

export function getTokens() {
  return tokens;
}

export function getToken(opts: { tokenName: string }) {
  return tokens[opts.tokenName];
}

export function setToken(tokenName: string, opts: { token: string }) {
  tokens[tokenName] = opts.token;
}

export function clearTokens() {
  clearObject({ object: tokens });
}
