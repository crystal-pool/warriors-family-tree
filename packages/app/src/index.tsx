import "@wft-repo/shared/environment";

import * as ReactDOM from "react-dom";
import { applyPolyfills } from "./utility/polyfill";
import { initializeTracking } from "./utility/telemetry";

initializeTracking();
applyPolyfills();

// The order matters. We need to initialize tracking first, then initialize dataService.
import { App } from "./appContainer";
const domRoot = document.querySelector(".react-root");
ReactDOM.render(<App />, domRoot);
