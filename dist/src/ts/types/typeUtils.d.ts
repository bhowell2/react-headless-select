/**
 * Allow the common values of A or B, but do not allow the exclusive values
 * of A and B to be in the same object.
 */
export declare type Either<A, B> = (A & {
    [K in keyof Omit<B, keyof A>]?: never;
}) | (B & {
    [K in keyof Omit<A, keyof B>]?: never;
});
