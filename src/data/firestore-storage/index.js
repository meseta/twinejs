/*
Firestore storage driver
*/

const pref = require('./pref');
const story = require('./story');
const storyFormat = require('../local-storage/story-format'); // this file appears to not require firebase, so we'll just use it

// firebase setup
const config = require('./firebase.js');
const firebase = require('firebase/app');

require('firebase/firestore');

if (!firebase.apps.length) {
	firebase.initializeApp(config);
}

let enabled = true;
let lastSaved = new Date();
const saveTime = 20; // the amount of time before saving

module.exports = store => {
	enabled = false;
	storyFormat.load(store);
	enabled = true;

	store.subscribe((mutation, state) => {
		if (!enabled) {
			return;
		}


		if (!state.auth.loggedIn) {
			switch (mutation.type) {
				case 'CREATE_FORMAT':
				case 'UPDATE_FORMAT':
				case 'DELETE_FORMAT':
					storyFormat.save(store);
					break;
			}
			return;
		}



		switch (mutation.type) {

			case 'CREATE_STORY':
				story.saveStory(
					state.auth.uid,
					state.story.stories.find(
						s => s.name === mutation.payload[0].name
					)
				);
				break;

			case 'UPDATE_STORY':
				story.saveStory(
					state.auth.uid,
					state.story.stories.find(
						s => s.id === mutation.payload[0]
					)
				);
				break;

			case 'DUPLICATE_STORY': {
				const dupe = state.story.stories.find(
					s => s.name === mutation.payload[1]
				);

				story.saveStory(state.auth.uid, dupe);

				dupe.passages.forEach(
					passage => story.savePassage(state.auth.uid, dupe.id, passage)
				);
				break;
			}

			case 'IMPORT_STORY': {
				const imported = state.story.stories.find(
					s => s.name === mutation.payload[0].name
				);

				story.saveStory(state.auth.uid, imported);

				imported.passages.forEach(
					passage => story.savePassage(state.auth.uid, imported.id, passage)
				);
				break;
			}

			case 'DELETE_STORY': {
				story.deleteStoryById(state.auth.uid, mutation.payload[0]);
				break;
			}

			/*
			When saving a passage, we have to make sure to save its parent
			story too, since its lastUpdate property has changed.
			*/

			case 'CREATE_PASSAGE_IN_STORY': {
				const parentStory = state.story.stories.find(
					s => s.id === mutation.payload[0]
				);
				const passage = parentStory.passages.find(
					p => p.name === mutation.payload[1].name
				);

				story.saveStory(state.auth.uid, parentStory);
				story.savePassage(state.auth.uid, parentStory.id, passage);
				break;
			}

			case 'UPDATE_PASSAGE_IN_STORY': {
				// this sub gets called a _lot_ so the following are various
				// filters to reduce how much we push to the database

				let props = Object.keys(mutation.payload[2]);

				// selection/deselection shouldn't cause a save
				if (props.some(key => key === 'selected')) {
					return;
				}

				// if it's text update, only update after time passed
				let nowTime = new Date();
				let diffTime = (nowTime - lastSaved)/1000;

				if (props.some(key => key === 'text') && diffTime > saveTime) {
					return;
				}

				// now for every other kind of prop, save
				const parentStory = state.story.stories.find(
					s => s.id === mutation.payload[0]
				);
				const passage = parentStory.passages.find(
					p => p.id === mutation.payload[1]
				);

				story.savePassage(state.auth.uid, parentStory.id, passage);
				lastSaved = nowTime;
				lastPassage = mutation.payload[1];

				break;
			}

			case 'DELETE_PASSAGE_IN_STORY': {
				const parentStory = state.story.stories.find(
					s => s.id === mutation.payload[0]
				);

				story.deletePassageById(state.auth.uid, parentStory.id, mutation.payload[1]);
				break;
			}

			case 'UPDATE_PREF':
				pref.save(state.auth.uid, mutation.payload);
				break;

			case 'CREATE_FORMAT':
			case 'UPDATE_FORMAT':
			case 'DELETE_FORMAT':
				storyFormat.save(store);
				break;

			case 'LOAD_FORMAT':
				/* This change doesn't need to be persisted. */
				break;

			case 'LOGIN':
			case 'LOGOUT':
			case 'SYNC':
				pref.load(state.auth.uid, store);
				story.load(state.auth.uid, store);
				break;

			default:
				throw new Error(
					`Don't know how to handle mutation ${mutation.type}`
				);
		}
	});
};
