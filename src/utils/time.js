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
    #nextTick;

    constructor(nextTick) {
        this.#nextTick = nextTick;
    }

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

    async start() {
        await this.#nextTick();
        this.reset();
        this.#startMs = performance.now();
    }

    async end() {
        await this.#nextTick();
        const grossMs = performance.now() - this.#startMs;
        this.#elapsedMs = grossMs - this.#idleMs;
    }

    async sleep(ms) {
        await new Promise((resolve) => {
            this.#idleMs += ms;
            setTimeout(resolve, ms);
        });
    }
}
