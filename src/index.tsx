/// <reference path="../shared/environment.d.ts" />

import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./appContainer";
import { applyPolyfills } from "./utility/polyfill";
import { initializeTracking } from "./utility/telemetry";

initializeTracking();
applyPolyfills();

const domRoot = document.querySelector(".react-root");
ReactDOM.render(<App />, domRoot);
