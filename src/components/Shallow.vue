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
import { watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import { useStore } from '@/utils/vuex';
import { Timer } from '@/utils/time';
import { DEFAULT_MAP_SIZE, indexToAlphabeticID, collatz } from '@/utils/generate';

const ABA_INDEX = 728;
const NUM_KEYS = 80;
const NUM_FIXED_KEYS = NUM_KEYS / 2;
const TIMEOUT_MS_DURING = 10;
const TIMEOUT_MS_BEFORE = TIMEOUT_MS_DURING * NUM_KEYS;

const timer = new Timer();

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoToggle
    },
    setup() {
        const store = useStore();

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
    },
    data() {
        return {
            includeTimeouts: true,
            collapseTimeouts: false,
            lastRunTimeMs: 0,
            idleTimeMs: 0,
            multipleCommitsLoading: false,
            commitWithLoopLoading: false,
            commitWithCloneLoading: false
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
            await this.$nextTick();
            timer.start();

            if (this.timeoutBefore) await timer.sleep(TIMEOUT_MS_BEFORE);

            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await timer.sleep(TIMEOUT_MS_DURING);

                const value = this.mapAtKey(key).i;

                if (value % 2 === 0) {
                    this.setMapAtKey({ key, value: value / 2 });
                } else {
                    this.setMapAtKey({ key, value: value * 3 + 1 });
                }
            }

            timer.end();
            this.lastRunTimeMs = timer.elapsedMs;
            this.idleTimeMs = timer.idleMs;
            this.multipleCommitsLoading = false;
        },
        async commitWithLoop() {
            this.commitWithLoopLoading = true;
            await this.$nextTick();
            timer.start();

            if (this.timeoutBefore) await timer.sleep(TIMEOUT_MS_BEFORE);

            const changeMap = {};
            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await timer.sleep(TIMEOUT_MS_DURING);

                const value = this.mapAtKey(key).i;
                changeMap[key] = collatz(value);
            }
            this.setMapAtKeys({ changeMap });

            timer.end();
            this.lastRunTimeMs = timer.elapsedMs;
            this.idleTimeMs = timer.idleMs;
            this.commitWithLoopLoading = false;
        },
        async commitWithClone() {
            this.commitWithCloneLoading = true;
            await this.$nextTick();
            timer.start();

            if (this.timeoutBefore) await timer.sleep(TIMEOUT_MS_BEFORE);

            const map = cloneDeep(this.map);
            for (const key of this.getKeys()) {
                if (this.timeoutDuring) await timer.sleep(TIMEOUT_MS_DURING);

                const value = map[key].i;
                map[key].i = collatz(value);
            }
            this.setMap(map);

            timer.end();
            this.lastRunTimeMs = timer.elapsedMs;
            this.idleTimeMs = timer.idleMs;
            this.commitWithCloneLoading = false;
        }
    }
};
</script>
