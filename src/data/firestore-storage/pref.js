// Functions for loading prefs out of firebase

const { setPref } = require('../actions/pref');
const firebase = require('firebase/app');

require('firebase/firestore');

module.exports = {
	saveAll(store) { // saves the entire store/prefs
		return firebase.firestore().collection('twine').doc('default').set(store.state.pref)
		.then(() => {
			console.log("Preferences saved");
		}).catch(err => {
			console.error(`Preferences could not be saved: ${err}`);
		});
	},

	save(payload) {
		return firebase.firestore().collection('twine').doc('default').set({
			[payload[0]]: payload[1]
		}, {merge: true})
		.then(() => {
			console.log("Preferences saved");
		}).catch(err => {
			console.error(`Preferences could not be saved: ${err}`);
		});
	},

	load(store) {
		return firebase.firestore().collection('twine').doc('default').get()
		.then(doc => {
			console.log("Preferences loaded");
			if (!doc.exists) {
				return;
			}
			let data = doc.data();

			for (let [name, value] of Object.entries(data)) {
				console.log("Preference " + name + " loaded as " + value);
				setPref(store, name, value);
			}
		}).catch(err => {
			console.error(`Preferences could not be loaded: ${err}`);
		});
	}
};
