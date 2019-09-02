// Auth module

// firebase setup
const config = require('../firestore-storage/firebase.js');
const firebase = require('firebase/app');

require('firebase/auth');

if (!firebase.apps.length) {
	firebase.initializeApp(config);
}

const authStore = (module.exports = {
	state: {
		loggedIn: false,
		uid: '',
		loginError: ''
	},

	mutations: {
		LOGIN(state, email, password) {
			firebase.auth().signInWithEmailAndPassword(email, password)
	    .then(firebaseUser => {
      	state.loggedIn = true;
      	state.uid = firebaseUser.user.uid;
	    })
	    .catch(error => {
      	console.error('Login error: ' + error);
      	state.loginError = error;
	    });
		},
		LOGOUT(state) {
			firebase.auth().signOut();
			state.uid = '';
			state.loggedIn = false;
			state.synced = false;
		},
		SYNC() {

		}
	}
});
