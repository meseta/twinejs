/* A contextual menu that appears when the user points at a passage. */

const Vue = require('vue');
const eventHub = require('../../../common/eventHub');
const locale = require('../../../locale');
const {testStory} = require('../../../common/launch-story');
const {updatePassage} = require('../../../data/actions/passage');
const {updateStory} = require('../../../data/actions/story');

require('./index.less');

module.exports = Vue.extend({
	template: require('./index.html'),

	props: {
		passage: {
			type: Object,
			required: true
		},

		parentStory: {
			type: Object,
			required: true
		}
	},

	data: () => ({
		expanded: false
	}),

	computed: {
		isStart() {
			return this.parentStory.startPassage === this.passage.id;
		},

		deleteTitle() {
			return locale.say('Delete “%s”', this.passage.name);
		},

		editTitle() {
			return locale.say('Edit “%s”', this.passage.name);
		},

		testTitle() {
			return locale.say('Test story starting here');
		},

		toggleExpandedTitle() {
			return locale.say('More passage options');
		},

		size() {
			if (this.passage.width === 100 && this.passage.height === 100) {
				return 'small';
			}

			if (this.passage.width === 200 && this.passage.height === 100) {
				return 'wide';
			}

			if (this.passage.width === 100 && this.passage.height === 200) {
				return 'tall';
			}

			if (this.passage.width === 200 && this.passage.height === 200) {
				return 'large';
			}
		}
	},

	watch: {
		expanded() {
			eventHub.$emit('drop-down-reposition');
		}
	},

	methods: {
		edit() {
			this.$emit('passage-edit');
		},

		passageDelete(e) {
			this.$emit('passage-delete', e.shiftKey);
		},

		test() {
			testStory(this.$store, this.parentStory.id, this.passage.id);
		},

		toggleExpanded() {
			this.expanded = !this.expanded;
		},

		setAsStart() {
			this.updateStory(this.parentStory.id, {
				startPassage: this.passage.id
			});
		},

		setSize(value) {
			switch (value) {
				case 'small':
					this.updatePassage(this.parentStory.id, this.passage.id, {
						width: 100,
						height: 100
					});
					break;

				case 'wide':
					this.updatePassage(this.parentStory.id, this.passage.id, {
						width: 200,
						height: 100
					});
					break;

				case 'tall':
					this.updatePassage(this.parentStory.id, this.passage.id, {
						width: 100,
						height: 200
					});
					break;

				case 'large':
					this.updatePassage(this.parentStory.id, this.passage.id, {
						width: 200,
						height: 200
					});
					break;

				default:
					throw new Error(`Don't know how to set size ${value}`);
			}

			eventHub.$emit('passage-position', this.passage, {});
		}
	},

	created: function() {
		eventHub.$on('drop-down-opened', () => {
			this.expanded = false;
		});
	},

	components: {
		'drop-down': require('../../../ui/drop-down')
	},

	vuex: {
		actions: {updatePassage, updateStory}
	}
});
