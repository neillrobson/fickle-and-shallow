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
    </div>
</template>

<script>
import { PendoButton, PendoInput, PendoInputNumber, PendoToggle } from '@pendo/components';
import { watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { useStore } from '@/utils/vuex';
import { sleep } from '@/utils/time';
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
    },
    data() {
        return {
            convertValue: 0,
            lookupValue: '',
            includeTimeouts: true,
            externalDispatchLoading: false,
            internalDispatchLoading: false,
            externalCommitLoading: false,
            internalCommitLoading: false
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
