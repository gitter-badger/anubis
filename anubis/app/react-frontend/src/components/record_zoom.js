import React from 'react';
import I from 'immutable';
import {connect} from 'react-redux';
import {Dialog, RaisedButton, FlatButton, CircularProgress} from 'material-ui';
import {routeActions} from 'redux-simple-router';
import {bindActionCreators} from 'redux';

import Actions from '../actions';

let getStateProps = state => {
	let fullDetails = state.get('details');
	let object = state.getIn(['details', 'object']);
	let modelName = state.getIn(['details', 'model']);
	let modelData = state.getIn(['models', modelName]);
	let detailsApi = state.getIn(['applicationData', 'detailsApi']);
	let detailsHtml = state.getIn(['applicationData', 'detailsHtml']);
	let hasDetails = !!state.get("details");
	let cache = state.getIn(['cache', 'details']);
	let searchHtml = state.getIn(['applicationData', 'searchHtml']);
	let baseURL = state.getIn(['applicationData', 'baseURL']);
	let error = state.getIn(['details', 'error']);
	let appData = state.get('applicationData');

	return {object, modelName, modelData, detailsApi, hasDetails, cache,
		searchHtml, baseURL, fullDetails, error, detailsHtml, appData};
};

let getDispatchProps = dispatch => ({
	goBack: () => dispatch(routeActions.goBack()),
	goTo: url => dispatch(routeActions.push(url)),
	fetchDetails: bindActionCreators(Actions.fetchDetails, dispatch),
	restoreDetails: bindActionCreators(Actions.restoreDetails, dispatch),
	clearDetails: bindActionCreators(Actions.clearDetails, dispatch),
	setGlobalError: bindActionCreators(Actions.setGlobalError, dispatch),
});

@connect(getStateProps, getDispatchProps)
export default class RecordZoom extends React.Component {
	static contextTypes = {
		muiTheme: React.PropTypes.object,
	}

	constructor(props) {
		super(props);

		this.state = { visible: false };
	}

	get detailsApi() {
		let model = this.props.params.model;
		let id = this.props.params.id;

		return eval("`" + this.props.detailsApi + "`");
	}

	get searchHtml() {
		let model = this.props.params.model;
		let expr = this.props.params.splat;
		let page = this.props.params.page;
		let sorting = this.props.params.sorting;

		return eval("`" + this.props.searchHtml + "`")
	}

	fetchDetails(params) {
		let model = params.model;
		let id = params.id;

		let cached = (this.props.cache) ?
			this.props.cache.getIn([model, `${id}`]) :
			null;

		if (cached) this.props.restoreDetails(cached);
		else this.props.fetchDetails(this.detailsApi);
	}

	conditionalCache(params) {
		let model = params.model;
		let id = params.id;

		let cached = (this.props.cache) ?
			this.props.cache.getIn([model, `${id}`]) :
			null;

		if (!cached) this.props.restoreDetails(this.props.fullDetails);

	}

	componentWillMount() {
		this.setState({visible: true});

		if (!this.props.hasDetails) {
			this.fetchDetails(this.props.params)
		}
		else {
			this.conditionalCache(this.props.params);
		}
	}

	componentWillUnmount() {
		if (this.props.hasDetails) this.props.clearDetails();
	}

	componentDidUpdate(previousProps) {
		if (this.props.error) {
			this.props.setGlobalError(this.props.error);
			if (this.state.visible) this._close();
			return;
		}

		let params = this.props.params;
		let prevParams = previousProps.params;
		let same = (params.model == prevParams.model);

		same = same && (params.id == prevParams.id);

		if (!same) {
			this.props.clearDetails();
			this.fetchDetails(this.props.params);
		}
	}

	_close() {
		this.setState({visible: false});

		setTimeout(() => {
			if (this.props.alsoSearching) {
				this.props.goTo(this.searchHtml);
			}
			else {
				this.props.goTo(this.props.baseURL);
			}
		}, 450);
	}

	get titleStyle() {
		const muiTheme = this.context.muiTheme;
		const rawTheme = muiTheme.rawTheme;
		const spacing = rawTheme.spacing;
		const gutter = spacing.desktopGutter;

		return {
			margin: 0,
			padding: `${gutter}px ${gutter}px 0 ${gutter}px`,
			color: rawTheme.palette.textColor,
			fontSize: 24,
			fontFamily: "'Roboto', sans-serif",
			lineHeight: '32px',
			fontWeight: 500,
		};
	}

	render() {
		let id = (this.props.object) ? this.props.object.get('id') : null;
		let title = "Carregando...";

		let contents = (
			<div style={{textAlign: "center"}}>
				<CircularProgress mode="indeterminate" size={2}/>
			</div>
		);

		let actions = [
			<FlatButton
				key="close"
				disabled={!this.props.hasDetails}
				label="Fechar"
				onTouchTap={() => this._close()} />
		];

		let makeActions = (elems) => <div style={{
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			padding: "6px"
		}}>{elems}</div>;

		if (this.props.error) {
			contents = <div></div>;
			title = "";
		}
		else if (this.props.hasDetails) {
			let [getTitle, Contents] = this.props.templates[
				this.props.modelName];

			contents = <Contents {...this.props} />;
			title = getTitle(this.props, this.titleStyle,
				this.context.muiTheme);

			if (Contents.getActions) {
				actions = Contents.getActions(this.props,
					this.context.muiTheme).concat(actions);
			}
		}

		if (actions.length == 1) actions = [<div></div>].concat(actions);

		return (
			<Dialog
				key="zoomDialog"
				title={title}
				modal={false}
				open={this.state.visible}
				autoScrollBodyContent={true}
				onRequestClose={() => this._close()}
				actions={makeActions(actions)}>
				{contents}
			</Dialog>
		);
	}
}

