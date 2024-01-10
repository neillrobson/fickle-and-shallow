import { alphabetMap } from '@/utils/generate';
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
        }
    },
    actions: {
        hydrate({ commit }) {
            commit('setMap', alphabetMap());
        }
    },
    getters: {
        mapAtKey: (state) => (key) => state.map[key]
    }
});
