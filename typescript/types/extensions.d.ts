export {};

declare global {
    interface String {
        toBoolean(): boolean;
        toNumber(): number;
    }
}