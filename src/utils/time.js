export let idleMs = 0;

export const sleep = (ms) =>
    new Promise((resolve) => {
        idleMs += ms;
        setTimeout(resolve, ms);
    });

export const resetIdleMs = () => (idleMs = 0);

export class Timer {
    #startMs;
    #elapsedMs;
    #idleMs;

    get idleMs() {
        return Math.round(this.#idleMs);
    }

    get elapsedMs() {
        return Math.round(this.#elapsedMs);
    }

    reset() {
        this.#elapsedMs = 0;
        this.#idleMs = 0;
    }

    start() {
        this.reset();
        this.#startMs = performance.now();
    }

    end() {
        const grossMs = performance.now() - this.#startMs;
        this.#elapsedMs = grossMs - this.#idleMs;
    }

    sleep(ms) {
        return new Promise((resolve) => {
            this.#idleMs += ms;
            setTimeout(resolve, ms);
        });
    }
}
