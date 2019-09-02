/*
Functions for moving stories in and out of firebase
*/
const deepcopy = require('deepcopy');

let { createStory } = require('../actions/story');
let { passageDefaults, storyDefaults } = require('../store/story');

const firebase = require('firebase/app');

require('firebase/firestore');


const story = module.exports = {
	/*
	Saves a story to firebase
	*/

	saveStory(userId, storyOrig) {
		if (!storyOrig.id) {
			throw new Error('Story has no id');
		}

		// deep copy to remove passages
		let storyCopy = deepcopy(storyOrig);

		delete storyCopy.passages;

		return firebase.firestore().collection('twine').doc(userId).collection('stories').doc(storyOrig.id).set(storyCopy)
		.then(() => {
			console.log("Story saved");
		}).catch(err => {
			console.error(`Story could not be saved: ${err}`);
		});
	},

	deleteStoryById(userId, storyId) {
		if (!storyId) {
			throw new Error('Story has no id');
		}

		return firebase.firestore().collection('twine').doc(userId)
															 .collection('stories').doc(storyId).delete()
 		.then(() => {
 			console.log("Story deleted");
 		}).catch(err => {
 			console.error(`Story could not be deleted: ${err}`);
 		});
	},

	/* Saves a passage. */

	savePassage(userId, storyId, passage) {
		if (!passage.id) {
			throw new Error('Passage has no id');
		}

		return firebase.firestore().collection('twine').doc(userId)
															 .collection('stories').doc(storyId)
															 .collection('passages').doc(passage.id).set(passage)
		.then(() => {
			console.log("Passage saved");
		}).catch(err => {
			console.error(`Passage could not be saved: ${err}`);
		});
	},

	/* Deletes a passage from local storage. */

	deletePassageById(userId, storyId, passageId) {
		return firebase.firestore().collection('twine').doc(userId)
															 .collection('stories').doc(storyId)
															 .collection('passages').doc(passageId).delete()
		.then(() => {
			console.log("Passage deleted");
		}).catch(err => {
			console.error(`Passage could not be deleted: ${err}`);
		});
	},

	load(userId, store) {

		return firebase.firestore().collection('twine').doc(userId).collection('stories').get()
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
					firebase.firestore().collection('twine').doc(userId)
																					.collection('stories').doc(newStory.id)
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
