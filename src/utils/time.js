export let idleMs = 0;

export const sleep = (ms) =>
    new Promise((resolve) => {
        idleMs += ms;
        setTimeout(resolve, ms);
    });

export const resetIdleMs = () => (idleMs = 0);
