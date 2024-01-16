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
        <hr />
        <pendo-button
            label="Looped Dispatch"
            :loading="loopedDispatchLoading"
            @click="loopedDispatch" />
    </div>
</template>

<script>
import { PendoButton, PendoInput, PendoInputNumber } from '@pendo/components';
import { watch } from 'vue';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { useStore } from './utils/vuex';
import { DEFAULT_MAP_SIZE, indexToAlphabeticID } from './utils/generate';

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoInput,
        PendoInputNumber
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
            loopedDispatchLoading: false
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
            increment: 'increment'
        }),
        ...mapActions({
            hydrate: 'hydrate',
            collatzAtKey: 'collatzAtKey'
        }),
        onClick() {
            this.increment();
        },
        async loopedDispatch() {
            this.loopedDispatchLoading = true;

            const keys = Array.from({ length: 49 }, () => Math.floor(Math.random() * DEFAULT_MAP_SIZE)).map(
                indexToAlphabeticID
            );
            keys.push('abc'); // We really want this one

            for (const key of keys) {
                await this.collatzAtKey(key);
            }

            this.loopedDispatchLoading = false;
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
