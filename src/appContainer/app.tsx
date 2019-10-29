import { Button, Divider, IconButton, Snackbar, Typography } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { Route, RouteComponentProps } from "react-router";
import { HashRouter } from "react-router-dom";
import { resourceManager } from "../localization";
import { browserLanguage, KnownLanguage } from "../localization/languages";
import { LanguageContext } from "../localization/react";
import { dataService } from "../services";
import { parseQueryParams } from "../utility/queryParams";
import { appInsights } from "../utility/telemetry";
import { AppEmbed } from "./appEmbed";
import { AppFull } from "./appFull";

export interface IAppProps {
}

interface IRouteRootProps extends RouteComponentProps {
}

const RouteRoot: React.FC<IRouteRootProps> = (props) => {
    const queryParams = parseQueryParams(props.location.search);
    if (queryParams.embed) {
        return <AppEmbed postMessageToken={queryParams.pmToken} />;
    } else {
        return <AppFull />;
    }
};

function formatError(error: any): string {
    if (!error || typeof error !== "object") return String(error);
    return error.stack || error.message || error.toString();
}

interface AppErrorBoundaryState {
    error?: any;
    componentStack?: string;
}

class AppErrorBoundary extends React.PureComponent<{}, AppErrorBoundaryState> {
    public constructor(props: Readonly<{}>) {
        super(props);
        this.state = {};
    }
    public static getDerivedStateFromError(error: any): Partial<AppErrorBoundaryState> {
        return { error };
    }
    public componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
        this.setState({ error, componentStack: errorInfo.componentStack });
    }
    public render() {
        if (this.state.error != null) {
            return (<div className="error-root-container">
                <h3>Oops</h3>
                <p>We are sorry for the inconvenience. Please refresh the page to see if it helps.</p>
                <p><Button variant="contained" onClick={() => location.reload()}><Icons.Refresh />Refresh</Button></p>
                <Divider />
                <p>If it does not help, consider opening an issue on GitHub to let us know.</p>
                <Typography variant="subtitle1">Please attach the following information when reporting the issue:</Typography>
                <div className="error-technical">
                    <Typography variant="subtitle2">Error</Typography>
                    <div className="error-callstack">{formatError(this.state.error)}</div>
                    <Typography variant="subtitle2">Component stack</Typography>
                    <div className="error-callstack">{this.state.componentStack}</div>
                </div>
            </div>);
        }
        return this.props.children;
    }
}

export const App: React.FC<IAppProps> = (props) => {
    const [language, setLanguage] = React.useState(browserLanguage);
    const [error, setError] = React.useState<Error>();
    const onSetLanguage = React.useCallback((lang: KnownLanguage) => {
        if (language !== lang) {
            appInsights.trackEvent({ name: "language.changed", properties: { language } });
            resourceManager.language = lang;
            dataService.language = lang;
            setLanguage(lang);
        }
    }, [language, setLanguage]);
    React.useEffect(() => {
        document.documentElement.lang = language;
        appInsights.trackEvent({ name: "language.applied", properties: { language } });
    }, [language]);
    React.useEffect(() => {
        function onGlobalError(e: ErrorEvent | PromiseRejectionEvent) {
            const merged = e as (ErrorEvent & PromiseRejectionEvent);
            setError(merged.error || merged.reason || "<Error>");
        }
        window.addEventListener("error", onGlobalError);
        window.addEventListener("unhandledrejection", onGlobalError);
        return () => {
            window.removeEventListener("error", onGlobalError);
            window.removeEventListener("unhandledrejection", onGlobalError);
        };
    });
    const errorMessage = error && formatError(error);
    return (
        <HashRouter>
            <LanguageContext.Provider value={{ language, setLanguage: onSetLanguage }}>
                <AppErrorBoundary>
                    <Route component={RouteRoot} />
                </AppErrorBoundary>
                <Snackbar
                    open={!!error}
                    message={
                        <div style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</div>
                    }
                    action={<IconButton
                        aria-label="close"
                        onClick={() => setError(undefined)}
                    >
                        <Icons.Close />
                    </IconButton>} />
            </LanguageContext.Provider>
        </HashRouter>
    );
};
