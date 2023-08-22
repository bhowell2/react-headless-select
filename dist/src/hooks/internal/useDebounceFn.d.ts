interface UseDebounceFnOptions<F extends (...args: any[]) => void> {
    callback: F;
    /**
     * If the callback should be disregarded if it is currently debounced .
     * @default true
     */
    clearOnUnmount?: boolean;
    /**
     * Amount of time to debounce the function call.
     * @default 300
     */
    millis?: number;
}
export declare function useDebounceFn<F extends (...args: any[]) => any>({ callback, clearOnUnmount, millis }: UseDebounceFnOptions<F>): F;
export {};
