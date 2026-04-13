export {};

declare global {
    interface String {
        toBoolean(): boolean;
        toNumber(): number;
    }

    interface Object {
        clean(): object;
        toArray(): [];
    }
}