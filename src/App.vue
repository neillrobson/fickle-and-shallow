<template>
    <div id="app">
        <pendo-input-number
            label="Convert to Alphabetic"
            :value="convertValue"
            @change="convertValue = $event" />
        <span>{{ conversion }}</span>
        <pendo-input
            label="Look up numeric"
            :value="lookupValue"
            @change="lookupValue = $event" />
        <span>{{ lookup }}</span>
        <hr />
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
import { PendoButton, PendoInput, PendoInputNumber, PendoToggle } from '@pendo/components';
import { ref, watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { useStore } from '@/utils/vuex';
import { sleep, resetIdleMs, idleMs } from '@/utils/time';
import { DEFAULT_MAP_SIZE, indexToAlphabeticID } from '@/utils/generate';

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoInput,
        PendoInputNumber,
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

        watch(
            () => store.state.map.abc?.i,
            (i) => {
                console.log(`Watching abc.i: ${i}`);
            }
        );

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
            convertValue: 0,
            lookupValue: '',
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
        },
        conversion() {
            return indexToAlphabeticID(this.convertValue);
        },
        lookup() {
            return this.mapAtKey(this.lookupValue);
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
            const keys = Array.from({ length: 49 }, () => Math.floor(Math.random() * DEFAULT_MAP_SIZE)).map(
                indexToAlphabeticID
            );
            keys.push('abc'); // We really want this one

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

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
