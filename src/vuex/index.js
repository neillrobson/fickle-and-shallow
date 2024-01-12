import { alphabetMap } from '@/utils/generate';
import { sleep } from '@/utils/time';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

export default new Store({
    state: {
        count: 0,
        map: {}
    },
    mutations: {
        increment(state) {
            state.count++;
        },
        setMap(state, map) {
            state.map = map;
        },
        setMapAtKey(state, { key, value }) {
            state.map[key].i = value;
        }
    },
    actions: {
        hydrate({ commit }) {
            commit('setMap', alphabetMap());
        },
        async collatzAtKey({ commit, getters }, key) {
            const value = getters.mapAtKey(key).i;
            await sleep(Math.random() * 1000);
            if (value % 2 === 0) {
                commit('setMapAtKey', { key, value: value / 2 });
            } else {
                commit('setMapAtKey', { key, value: value * 3 + 1 });
            }
        }
    },
    getters: {
        mapAtKey: (state) => (key) => state.map[key]
    }
});
