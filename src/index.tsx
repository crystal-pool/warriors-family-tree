import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./app";
import { AppModel } from "./appModel";

const appModel = new AppModel();
const domRoot = document.querySelector(".react-root");
ReactDOM.render(<App model={appModel} />, domRoot);
