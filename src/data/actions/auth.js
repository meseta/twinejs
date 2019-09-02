/*
Auth-related actions.
*/

module.exports = {
	login({dispatch}, username, password) {
		dispatch('LOGIN', username, password);
	},
	logout({ dispatch }) {
		dispatch('LOGOUT');
	},
	sync({ dispatch }) {
		dispatch('SYNC');
	}
};