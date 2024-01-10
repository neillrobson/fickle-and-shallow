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
    </div>
</template>

<script>
import { PendoButton, PendoInput, PendoInputNumber } from '@pendo/components';
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex';
import { indexToAlphabeticID } from './utils/generate';

export default {
    name: 'App',
    components: {
        PendoButton,
        PendoInput,
        PendoInputNumber
    },
    data() {
        return {
            convertValue: 0,
            lookupValue: ''
        };
    },
    computed: {
        ...mapState({
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
            hydrate: 'hydrate'
        }),
        onClick() {
            this.increment();
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
