import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppModel } from './appModel';
import { App } from './app';

const appModel = new AppModel();
const domRoot = document.querySelector(".react-root");
ReactDOM.render(<App model={appModel} />, domRoot);
