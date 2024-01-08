<template>
    <div id="app">
        <img alt="Vue logo" src="./assets/logo.png" />
        <pendo-button :label="label" @click="onClick" />
        <HelloWorld msg="Welcome to Your Vue.js App" />
    </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";
import { PendoButton } from "@pendo/components";
import { mapMutations, mapState } from "vuex";

export default {
    name: "App",
    components: {
        HelloWorld,
        PendoButton,
    },
    computed: {
        ...mapState({
            count: (state) => state.count,
        }),
        label() {
            return `Count: ${this.count}`;
        },
    },
    methods: {
        ...mapMutations({
            increment: "increment",
        }),
        onClick() {
            this.increment();
        },
    },
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
