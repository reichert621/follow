export type Callback = (err?: any, result?: any) => void;

export const capitalize = (str: string) => {
  return str.slice(0, 1).toUpperCase()
    .concat(str.slice(1).toLowerCase());
};
