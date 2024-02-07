<template>
    <div id="empty">
        <pendo-button
            :label="label"
            @click="onClick" />
        <pendo-button
            label="Hydrate Vuex"
            :prefix-icon="vuexHydrated ? undefined : 'alert-circle'"
            @click="onHydrate" />
        <hr />
        <p>Hello world</p>
        <hr />
        <p>Time spent on last run: {{ lastRunTimeMs }}ms</p>
        <p>Idle time: {{ idleTimeMs }}ms</p>
    </div>
</template>

<script>
import { PendoButton } from '@pendo/components';
import { watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { useStore } from '@/utils/vuex';
import { Timer } from '@/utils/time';
import { indexToAlphabeticID, makeFiller } from '@/utils/generate';

const MAP_SIZE = 1000;
const ABA_INDEX = 728;
const NUM_KEYS = 100;
const NUM_FIXED_KEYS = NUM_KEYS / 2;

export default {
    name: 'App',
    components: {
        PendoButton
    },
    setup() {
        const store = useStore();

        watch(
            () => store.state.map,
            () => {
                console.log('Shallow watcher');
            }
        );

        for (let i = 0; i < 10; i++)
            watch(
                () => store.state.map,
                () => {
                    console.log(`Deep watcher ${i}`);
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
            commitWithCloneLoading: false,
            shallowCloneLoading: false
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
    created() {
        const { $nextTick } = this;

        this.timer = new Timer($nextTick.bind(this));
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
        onHydrate() {
            this.hydrate({ count: MAP_SIZE, filler: makeFiller(100) });
        },
        getKeys() {
            const keys = [];

            for (let i = 0; i < NUM_KEYS; i++) {
                if (i % 2 === 0) {
                    keys.push(indexToAlphabeticID(i / 2 + ABA_INDEX));
                } else {
                    let index = Math.floor(Math.random() * (MAP_SIZE - NUM_FIXED_KEYS));
                    index = (index + ABA_INDEX + NUM_FIXED_KEYS) % MAP_SIZE;
                    keys.push(indexToAlphabeticID(index));
                }
            }

            return keys;
        }
    }
};
</script>
