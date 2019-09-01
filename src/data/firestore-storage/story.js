/*
Functions for moving stories in and out of firebase
*/

let { createStory } = require('../actions/story');
let { passageDefaults, storyDefaults } = require('../store/story');
//let commaList = require('./comma-list');
const firebase = require('firebase/app');

require('firebase/firestore');


const story = module.exports = {
	/*
	A wrapper for a series of save/delete operations. This takes a function as
	argument that will receive an object keeping track of the transaction. This
	function should then make save and delete calls as necessary, passing the
	provided transaction object as their first argument.
	*/
	//
	// update(func) {
	// 	let transaction = {
	// 		storyIds: window.localStorage.getItem('twine-stories') || '',
	// 		passageIds: window.localStorage.getItem('twine-passages') || ''
	// 	};
	//
	// 	func(transaction);
	//
	// 	window.localStorage.setItem('twine-stories', transaction.storyIds);
	// 	window.localStorage.setItem('twine-passages', transaction.passageIds);
	// },

	/*
	Saves a story to local storage. This does *not* affect any child passages.
	*/

	saveStory(story) {
		if (!story.id) {
			throw new Error('Story has no id');
		}

		return firebase.firestore().collection('twine').doc('default').collection('stories').doc(story.id).set(story)
		.then(() => {
			console.log("Story saved");
		}).catch(err => {
			console.error(`Story could not be saved: ${err}`);
		});
	},
	//
	// /*
	// Deletes a story from local storage. This does *not* affect any child
	// passages. You *must* delete child passages manually.
	// */
	//
	// deleteStory(transaction, story) {
	// 	if (!story.id) {
	// 		throw new Error('Story has no id');
	// 	}
	//
	// 	transaction.storyIds = commaList.remove(transaction.storyIds, story.id);
	// 	window.localStorage.removeItem('twine-stories-' + story.id);
	// },
	//
	// /* Saves a passage to local storage. */

	savePassage(storyId, passage) {
		if (!passage.id) {
			throw new Error('Passage has no id');
		}

		return firebase.firestore().collection('twine').doc('default')
															 .collection('stories').doc(storyId)
															 .collection('passages').doc(passage.id).set(passage)
		.then(() => {
			console.log("Passage saved");
		}).catch(err => {
			console.error(`Passage could not be saved: ${err}`);
		});
	},

	// /* Deletes a passage from local storage. */
	//
	// deletePassage(transaction, passage) {
	// 	if (!passage.id) {
	// 		throw new Error('Passage has no id');
	// 	}
	//
	// 	story.deletePassageById(transaction, passage.id);
	// },
	//
	// /* Deletes a passage from local storage. */
	//
	// deletePassageById(transaction, id) {
	// 	transaction.passageIds = commaList.remove(
	// 		transaction.passageIds,
	// 		id
	// 	);
	// 	window.localStorage.removeItem('twine-passages-' + id);
	// },

	load(store) {

		return firebase.firestore().collection('twine').doc('default').collection('stories').get()
		.then(stories => {
			if (stories.empty) {
				return;
			}

			let promises = [];

			stories.forEach(doc => {
				let newStory = doc.data();

				/* Set defaults if any are missing. */
				Object.keys(storyDefaults).forEach(key => {
					if (newStory[key] === undefined) {
						newStory[key] = storyDefaults[key];
					}
				});

				/* set the lastUpdate property to a date. */
				newStory.lastUpdate = newStory.lastUpdate.toDate();

				/*
				Force the passages property to be an empty array -- we'll
				populate it when we load passages below.
				*/
				newStory.passages = [];

				promises.push(
					firebase.firestore().collection('twine').doc('default')
																					.collection('stories').doc(doc.id)
																					.collection('passages').get()
					.then(passages => {
						if (passages.empty) {
							return;
						}

						passages.forEach(passage => {

							let newPassage = passage.data();

							Object.keys(passageDefaults).forEach(key => {
								if (newPassage[key] === undefined) {
									newPassage[key] = passageDefaults[key];
								}
							});

							/* Remove empty tags. */
							newPassage.tags = newPassage.tags.filter(
								tag => tag.length && tag.length > 0
							);

							newStory.passages.push(newPassage);

						});

						createStory(store, newStory);
					})
					.catch(err => {
						console.error(`Passages could not be loaded: ${err}`);
					})
				);
			});

			return Promise.all(promises);
		})
		.then(results => {
			if (results) {
				console.log('finished loading '+ results.length + ' stories');
			}
		})
		.catch(err => {
			console.error(`Story could not be loaded: ${err}`);
		});


	}
};
