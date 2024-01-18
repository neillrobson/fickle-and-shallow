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
        async multipleCommits() {
            this.multipleCommitsLoading = true;

            await sleep(0); // Force a tick for timing purposes

            for (const key of this.getKeys()) {
                const value = this.mapAtKey(key).i;

                if (this.includeTimeouts) await sleep(10);

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

            const changeMap = {};

            for (const key of this.getKeys()) {
                await sleep(this.includeTimeouts ? 10 : 0);

                const value = this.mapAtKey(key).i;
                changeMap[key] = collatz(value);
            }

            this.setMapAtKeys({ changeMap });

            this.commitWithLoopLoading = false;
        },
        async commitWithClone() {
            this.commitWithCloneLoading = true;

            const map = cloneDeep(this.map);

            for (const key of this.getKeys()) {
                await sleep(this.includeTimeouts ? 10 : 0);

                const value = map[key].i;
                map[key].i = collatz(value);
            }

            this.setMap(map);

            this.commitWithCloneLoading = false;
        }
    }
};
</script>
