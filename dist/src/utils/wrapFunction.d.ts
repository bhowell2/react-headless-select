/**
 * Wraps a function, calling the wrap function and returning
 * the original function's result (not the wrapped function's
 * result). If the original function is not provided, undefined
 * is returned.
 */
export declare function wrapFunction<F extends (...args: any[]) => any>(orig: F | undefined, wrap: F): F;
