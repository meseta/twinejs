/**
 Shows the user's login form

 @class LoginView
 @extends Backbone.Marionette.View
**/

'use strict';
const Vue = require('vue');
const { login, sync} = require('../data/actions/auth.js');

require('./index.less');

module.exports = Vue.extend({
	template: require('./index.html'),

	data: () => ({
		username: '',
		password: ''
	}),

	computed: {
		loginErrorFlag() {
			if (this.loginError) {
				return true;
			}
			return false;
		}
	},

	methods: {
		doLogin() {
			this.login(this.username, this.password);
		}
	},

	watch: {
		loggedIn: {
			handler(value) {
				if (value) {
					this.sync();
					window.location.hash = '#stories';
				}
			},
			immediate: true
		}

	},

	vuex: {
		actions: {
			login,
			sync
		},

		getters: {
			loggedIn: state=> state.auth.loggedIn,
			loginError: state => state.auth.loginError
		}
	}
});
