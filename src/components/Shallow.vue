<template>
    <div id="shallow">
        <pendo-button
            :label="label"
            @click="onClick" />
        <pendo-button
            label="Hydrate Vuex"
            @click="hydrate" />
        <pendo-toggle
            label="Include Timeouts"
            label-position="left"
            :value="includeTimeouts"
            @change="includeTimeouts = $event" />
        <hr />
        <pendo-button
            label="External Looped Dispatch"
            :loading="externalDispatchLoading"
            @click="externalDispatch" />
        <pendo-button
            label="Internal Looped Dispatch"
            :loading="internalDispatchLoading"
            @click="internalDispatch" />
        <hr />
        <pendo-button
            label="External Looped Commit"
            :loading="externalCommitLoading"
            @click="externalCommit" />
        <pendo-button
            label="Internal Looped Commit"
            :loading="internalCommitLoading"
            @click="internalCommit" />
        <hr />
        <p>Time spent on last run: {{ lastRunTimeMs }}ms</p>
        <p>Idle time: {{ idleTimeMs }}ms</p>
    </div>
</template>

<script>
import { PendoButton, PendoToggle } from '@pendo/components';
import { ref, watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { useStore } from '@/utils/vuex';
import { sleep, resetIdleMs, idleMs } from '@/utils/time';
import { DEFAULT_MAP_SIZE, indexToAlphabeticID } from '@/utils/generate';

const ABA_INDEX = 728;

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoToggle
    },
    setup() {
        const store = useStore();

        const externalDispatchLoading = ref(false);
        const internalDispatchLoading = ref(false);
        const externalCommitLoading = ref(false);
        const internalCommitLoading = ref(false);
        const lastRunTimeMs = ref(0);
        const idleTimeMs = ref(0);

        watch(
            () => store.state.map,
            () => {
                console.log('Shallow watcher');
            }
        );

        watch(
            () => store.state.map,
            () => {
                console.log('Deep watcher');
            },
            { deep: true }
        );

        // aba to abj
        for (let i = 0; i < 10; i++) {
            const key = indexToAlphabeticID(i + ABA_INDEX);
            watch(
                () => store.state.map[key]?.i,
                (i) => {
                    console.log(`Watching ${key}.i: ${i}`);
                }
            );
        }

        let start = 0;
        const loadingWatcher = (loading) => {
            if (loading) {
                start = performance.now();
            } else {
                const end = performance.now();
                const grossTime = end - start;
                idleTimeMs.value = Math.round(idleMs);
                lastRunTimeMs.value = Math.round(grossTime - idleMs);
                resetIdleMs();
            }
        };

        watch(externalDispatchLoading, loadingWatcher);
        watch(internalDispatchLoading, loadingWatcher);
        watch(externalCommitLoading, loadingWatcher);
        watch(internalCommitLoading, loadingWatcher);

        return {
            externalDispatchLoading,
            internalDispatchLoading,
            externalCommitLoading,
            internalCommitLoading,
            lastRunTimeMs,
            idleTimeMs
        };
    },
    data() {
        return {
            includeTimeouts: true
        };
    },
    computed: {
        ...mapState({
            map: (state) => state.map,
            count: (state) => state.count
        }),
        ...mapGetters({
            mapAtKey: 'mapAtKey'
        }),
        label() {
            return `Count: ${this.count}`;
        }
    },
    methods: {
        ...mapMutations({
            increment: 'increment',
            setMapAtKey: 'setMapAtKey'
        }),
        ...mapActions({
            hydrate: 'hydrate',
            collatzAtKey: 'collatzAtKey',
            collatzInternalLoop: 'collatzInternalLoop',
            collatzInternalCommit: 'collatzInternalCommit'
        }),
        onClick() {
            this.increment();
        },
        getKeys() {
            const keys = [];

            for (let i = 0; i < 20; i++) {
                if (i % 2 === 0) {
                    keys.push(indexToAlphabeticID(i / 2 + ABA_INDEX));
                } else {
                    let index = Math.floor(Math.random() * (DEFAULT_MAP_SIZE - 10));
                    index = (index + ABA_INDEX + 10) % DEFAULT_MAP_SIZE;
                    keys.push(indexToAlphabeticID(index));
                }
            }

            return keys;
        },
        async externalDispatch() {
            this.externalDispatchLoading = true;

            for (const key of this.getKeys()) {
                await this.collatzAtKey({ key, includeTimeouts: this.includeTimeouts });
            }

            this.externalDispatchLoading = false;
        },
        async internalDispatch() {
            this.internalDispatchLoading = true;

            await this.collatzInternalLoop({ keys: this.getKeys(), includeTimeouts: this.includeTimeouts });

            this.internalDispatchLoading = false;
        },
        async externalCommit() {
            this.externalCommitLoading = true;

            await sleep(0); // Force a tick for timing purposes

            for (const key of this.getKeys()) {
                const value = this.mapAtKey(key).i;

                if (this.includeTimeouts) await sleep(Math.random() * 250);

                if (value % 2 === 0) {
                    this.setMapAtKey({ key, value: value / 2 });
                } else {
                    this.setMapAtKey({ key, value: value * 3 + 1 });
                }
            }

            this.externalCommitLoading = false;
        },
        async internalCommit() {
            this.internalCommitLoading = true;

            await this.collatzInternalCommit({ keys: this.getKeys(), includeTimeouts: this.includeTimeouts });

            this.internalCommitLoading = false;
        }
    }
};
</script>
