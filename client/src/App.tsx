import { faCog, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import React, { MemoExoticComponent, useEffect } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch, useLocation } from 'react-router-dom';
import Api from './api/Api';
import Cell from './components/Cell';
import List from './pages/List';
import './style/app.scss';
import Login from './pages/Login';
import Permissions from './pages/Permissions';

const Logout = () => {
	useEffect(() => {
		Api.logout();
	});
	return <Redirect to='' />
}

const App = () => {

	const pages: IPage[] = [
		{ path: '/login', component: Login },
		{ path: '/permissions/:id', component: Permissions },
		{ path: '/', component: List, id: 'list' },
	];

	return (
		<Router>
			<section className='container'>

				<Switch>

					<Route path='/logout'>
						<Logout />
					</Route>


					{pages.map(page =>
						<Route key={page.path} path={page.path}>
							<Page {...page} />
						</Route >
					)}
					<Route>
						<Cell area='page'>
							<h1 className='empty-info'>404 - Not Found</h1>
						</Cell>
					</Route>

				</Switch>
			</section>
		</Router>
	);
}

export interface IPage {
	path: string;
	component: (() => JSX.Element | null) | MemoExoticComponent<() => JSX.Element | null>;
	id?: string;
	text?: string;
	icon?: IconDefinition;
}

const Page = (page: IPage) => {

	const path = useLocation().pathname.slice(1) + '/';
	const id = page.id ?? path.slice(0, path.indexOf('/'));

	return (
		<Cell area='page' id={id}>
			<page.component />
		</Cell>
	);
}

export default App;
