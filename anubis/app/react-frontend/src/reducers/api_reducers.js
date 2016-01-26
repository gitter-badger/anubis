import I from 'immutable';

export let Details = {
	ReducerMap: {
		'FETCH_DETAILS': (state, action) => {
			return action.payload;
		},
		'CLEAR_DETAILS': (state, action) => null
	},
	keyPath: ["details"]
};

export let Search = {
	ReducerMap: {
		'FETCH_SEARCH': (state, action) => {
			return action.payload;
		},
		'CLEAR_SEARCH': (state, action) => (I.fromJS({
			expression: null,
			textExpression: "",
			pagination: null,
			actions: {},
			visible: false,
			model: state.get('model'),
			results: [],
			sorting: { by: null, ascending: true },
			selection: []
		}))
	},
	keyPath: ["searchResults"]
};