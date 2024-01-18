<template>
    <div id="app">
        <pendo-tabs
            v-model="activeTab"
            class="tabs"
            vertical
            :tabs="tabs">
            <template #fickle>
                <fickle />
            </template>
            <template #shallow>
                <shallow />
            </template>
        </pendo-tabs>
    </div>
</template>

<script>
import { PendoTabs } from '@pendo/components';
import Fickle from '@/components/Fickle.vue';
import Shallow from '@/components/Shallow.vue';

export default {
    name: 'App',
    components: {
        Fickle,
        Shallow,
        PendoTabs
    },
    data() {
        return {
            activeTab: 'shallow',
            tabs: [
                {
                    prop: 'fickle',
                    label: 'Fickle',
                    lazy: true
                },
                {
                    prop: 'shallow',
                    label: 'Shallow',
                    lazy: true
                }
            ]
        };
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
    width: 800px;
    height: 600px;
}

.tabs {
    height: 100%;
}
</style>
