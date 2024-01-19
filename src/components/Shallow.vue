<template>
    <div id="shallow">
        <pendo-button
            :label="label"
            @click="onClick" />
        <pendo-button
            label="Hydrate Vuex"
            :prefix-icon="vuexHydrated ? undefined : 'alert-circle'"
            @click="hydrate" />
        <hr />
        <pendo-toggle
            label="Include Timeouts"
            label-position="left"
            :value="includeTimeouts"
            @change="includeTimeouts = $event" />
        <pendo-toggle
            label="Collapse Timeouts"
            label-position="left"
            :value="collapseTimeouts"
            @change="collapseTimeouts = $event" />
        <hr />
        <pendo-button
            label="Multiple Commits"
            :loading="multipleCommitsLoading"
            @click="multipleCommits" />
        <pendo-button
            label="Commit with Loop"
            :loading="commitWithLoopLoading"
            @click="commitWithLoop" />
        <pendo-button
            label="Commit with Clone"
            :loading="commitWithCloneLoading"
            @click="commitWithClone" />
        <hr />
        <p>Time spent on last run: {{ lastRunTimeMs }}ms</p>
        <p>Idle time: {{ idleTimeMs }}ms</p>
    </div>
</template>

<script>
import { PendoButton, PendoToggle } from '@pendo/components';
import { ref, watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import { useStore } from '@/utils/vuex';
import { sleep, resetIdleMs, idleMs } from '@/utils/time';
import { DEFAULT_MAP_SIZE, indexToAlphabeticID, collatz } from '@/utils/generate';

const ABA_INDEX = 728;
const NUM_KEYS = 80;
const NUM_FIXED_KEYS = NUM_KEYS / 2;
const TIMEOUT_MS_DURING = 10;
const TIMEOUT_MS_BEFORE = TIMEOUT_MS_DURING * NUM_KEYS;

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoToggle
    },
    setup() {
        const store = useStore();

        const multipleCommitsLoading = ref(false);
        const commitWithLoopLoading = ref(false);
        const commitWithCloneLoading = ref(false);
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
        for (let i = 0; i < NUM_FIXED_KEYS; i++) {
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

        watch(multipleCommitsLoading, loadingWatcher);
        watch(commitWithLoopLoading, loadingWatcher);
        watch(commitWithCloneLoading, loadingWatcher);

        return {
            multipleCommitsLoading,
            commitWithLoopLoading,
            commitWithCloneLoading,
            lastRunTimeMs,
            idleTimeMs
        };
    },
    data() {
        return {
            includeTimeouts: true,
            collapseTimeouts: false
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
        vuexHydrated() {
            return Object.keys(this.map).length > 0;
        },
        timeoutBefore() {
            return this.includeTimeouts && this.collapseTimeouts;
        },
        timeoutDuring() {
            return this.includeTimeouts && !this.collapseTimeouts;
        }
    },
    methods: {
        ...mapMutations({
            increment: 'increment',
            setMap: 'setMap',
            setMapAtKey: 'setMapAtKey',
            setMapAtKeys: 'setMapAtKeys'
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

            for (let i = 0; i < NUM_KEYS; i++) {
                if (i % 2 === 0) {
                    keys.push(indexToAlphabeticID(i / 2 + ABA_INDEX));
                } else {
                    let index = Math.floor(Math.random() * (DEFAULT_MAP_SIZE - NUM_FIXED_KEYS));
                    index = (index + ABA_INDEX + NUM_FIXED_KEYS) % DEFAULT_MAP_SIZE;
                    keys.push(indexToAlphabeticID(index));
                }
            }

            return keys;
        },
        async multipleCommits() {
            this.multipleCommitsLoading = true;

            await sleep(this.timeoutBefore ? TIMEOUT_MS_BEFORE : 0);

            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await sleep(TIMEOUT_MS_DURING);

                const value = this.mapAtKey(key).i;

                if (value % 2 === 0) {
                    this.setMapAtKey({ key, value: value / 2 });
                } else {
                    this.setMapAtKey({ key, value: value * 3 + 1 });
                }
            }

            this.multipleCommitsLoading = false;
        },
        async commitWithLoop() {
            this.commitWithLoopLoading = true;

            await sleep(this.timeoutBefore ? TIMEOUT_MS_BEFORE : 0);

            const changeMap = {};

            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await sleep(TIMEOUT_MS_DURING);

                const value = this.mapAtKey(key).i;
                changeMap[key] = collatz(value);
            }

            this.setMapAtKeys({ changeMap });

            this.commitWithLoopLoading = false;
        },
        async commitWithClone() {
            this.commitWithCloneLoading = true;

            await sleep(this.timeoutBefore ? TIMEOUT_MS_BEFORE : 0);

            const map = cloneDeep(this.map);

            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await sleep(TIMEOUT_MS_DURING);

                const value = map[key].i;
                map[key].i = collatz(value);
            }

            this.setMap(map);

            this.commitWithCloneLoading = false;
        }
    }
};
</script>
