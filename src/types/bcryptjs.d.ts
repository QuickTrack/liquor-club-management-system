declare module "bcryptjs" {
  export function hash(data: string | Buffer | NodeJS.TypedArray, salt: string | number): Promise<string>;
  export function hash(data: string | Buffer | NodeJS.TypedArray, salt: string | number, callback: (err: Error | null, hash: string) => void): void;
  export function compare(data: string | Buffer | NodeJS.TypedArray, encrypted: string): Promise<boolean>;
  export function compare(data: string | Buffer | NodeJS.TypedArray, encrypted: string, callback: (err: Error | null, match: boolean) => void): void;
  export function genSalt(rounds: number): Promise<string>;
  export function genSalt(rounds: number, callback: (err: Error | null, salt: string) => void): void;
  export function hashSync(data: string | Buffer | NodeJS.TypedArray, salt: string | number): string;
  export function compareSync(data: string | Buffer | NodeJS.TypedArray, encrypted: string): boolean;
  export function genSaltSync(rounds: number): string;
}

