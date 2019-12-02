import { Button, Divider, IconButton, Link, Snackbar, Typography } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import { TelemetryTrace } from "@microsoft/applicationinsights-properties-js";
import { Location } from "history";
import * as React from "react";
import { Route, RouteComponentProps } from "react-router";
import { HashRouter } from "react-router-dom";
import { generateRandomId8 } from "../../shared/utility";
import { contactUrl, issueTrackerUrl } from "../constants";
import { resourceManager } from "../localization";
import { LocalizationProgress } from "../localization/common";
import { browserLanguage, KnownLanguage } from "../localization/languages";
import { ILanguageContextValue, LanguageContext } from "../localization/react";
import { dataService } from "../services";
import { parseQueryParams } from "../utility/queryParams";
import { IPageTitleContextValue, PageTitleContext, PageTitleContextBits } from "../utility/react";
import { appInsights } from "../utility/telemetry";
import { AppEmbed } from "./appEmbed";
import { AppFull } from "./appFull";

export interface IAppProps {
}

export interface IAppStates {
    languageContext: ILanguageContextValue;
    titleContext: IPageTitleContextValue;
    error?: any;
}

interface IRouteRootProps extends RouteComponentProps {
}

function startNewPageScope(location: Location<any>): string {
    const id = generateRandomId8();
    // Let the previous page tracking stop first.
    appInsights.startTrackPage(id);
    appInsights.context.telemetryTrace = new TelemetryTrace(id, undefined, location.pathname + location.search);
    return id;
}

function endPageScope(id: string, title?: string) {
    appInsights.stopTrackPage(id, undefined, { _name: title, contextId: id });
}

export class RouteRoot extends React.PureComponent<IRouteRootProps> {
    private _pageScopeId: string | undefined;
    private _pageTitle: string | undefined;
    public constructor(props: Readonly<IRouteRootProps>) {
        super(props);
    }
    private _onLocationChanged(): void {
        // Keep track of the last title before routing to the next location.
        endPageScope(this._pageScopeId!, this._pageTitle);
        this._pageScopeId = startNewPageScope(this.props.location);
    }
    public render() {
        const queryParams = parseQueryParams(this.props.location.search);
        return (<PageTitleContext.Consumer unstable_observedBits={PageTitleContextBits.title}>
            {(state) => {
                this._pageTitle = state.title;
                return (queryParams.embed
                    ? <AppEmbed postMessageToken={queryParams.pmToken} />
                    : <AppFull />);
            }}
        </PageTitleContext.Consumer>);
    }
    public componentDidMount() {
        this._pageScopeId = startNewPageScope(this.props.location);
    }
    public componentWillUnmount() {
        endPageScope(this._pageScopeId!, this._pageTitle);
    }
    public componentDidUpdate(prevProps: Readonly<IRouteRootProps>) {
        if (prevProps.location !== this.props.location) {
            this._onLocationChanged();
        }
    }
}

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
                <p>Sincerely,</p>
                <p>Warriors Family Tree</p>
                <Divider />
                <p>If it does not help, consider <Link href={issueTrackerUrl} target="_blank">opening an issue on GitHub</Link> to let us know.</p>
                <p><Link href={contactUrl} target="_blank">Other contact information</Link></p>
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

export class App extends React.PureComponent<IAppProps, IAppStates> {
    public constructor(props: Readonly<IAppProps>) {
        super(props);
        this.state = {
            languageContext: {
                language: browserLanguage,
                setLanguage: this.setLanguage
            },
            titleContext: {
                title: document.title,
                withAppName: false,
                setTitle: this.setTitle
            },
            error: undefined
        };
    }
    public setLanguage = (language: KnownLanguage) => {
        if (language === this.state.languageContext.language) return;
        // Change the languages of external objects first.
        resourceManager.language = language;
        dataService.language = language;
        // Then trigger render.
        this.setState({
            languageContext: { language, setLanguage: this.setLanguage }
        });
    }
    public setTitle = (title: string, withAppName: boolean) => {
        const context = this.state.titleContext;
        if (context.title !== title || context.withAppName !== withAppName) {
            this.setState({ titleContext: { title, withAppName, setTitle: this.setTitle } });
        }
    }
    public clearError = () => {
        this.setState({ error: undefined });
    }
    private _applyLanguage(language: KnownLanguage, prevLanguage?: KnownLanguage): void {
        document.documentElement.lang = language;
        appInsights.trackEvent({ name: "language.applied", properties: { language, prevLanguage } });
    }
    private _applyTitle(title?: string, withAppName?: boolean): void {
        if (withAppName || withAppName == null) {
            document.title = (title ? (title + " - ") : "") + "Warriors Family Tree";
        } else {
            document.title = title || "";
        }
    }
    private _onGlobalError = (e: ErrorEvent | PromiseRejectionEvent) => {
        const merged = e as (ErrorEvent & PromiseRejectionEvent);
        this.setState({ error: merged.error || merged.reason || "<Error>" });
    }
    public render() {
        const errorMessage = this.state.error != null && formatError(this.state.error);
        return (
            <HashRouter>
                <PageTitleContext.Provider value={this.state.titleContext}>
                    <LanguageContext.Provider value={this.state.languageContext}>
                        <AppErrorBoundary>
                            <Route component={RouteRoot} />
                        </AppErrorBoundary>
                        <Snackbar
                            open={this.state.error != null}
                            message={
                                <div style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</div>
                            }
                            action={<IconButton
                                aria-label="close"
                                color="inherit"
                                onClick={this.clearError}
                            >
                                <Icons.Close />
                            </IconButton>} />
                        <LocalizationProgressSnakbar language={this.state.languageContext.language} progress={resourceManager.getPromptRaw("__STATUS")} />
                    </LanguageContext.Provider>
                </PageTitleContext.Provider>
            </HashRouter>
        );
    }
    public componentDidMount() {
        window.addEventListener("error", this._onGlobalError);
        window.addEventListener("unhandledrejection", this._onGlobalError);
        this._applyLanguage(this.state.languageContext.language);
    }
    public componentDidUpdate(prevProps: Readonly<IAppProps>, prevStates: Readonly<IAppStates>) {
        if (prevStates.languageContext.language !== this.state.languageContext.language) {
            this._applyLanguage(this.state.languageContext.language, prevStates.languageContext.language);
        }
        if (prevStates.titleContext !== this.state.titleContext) {
            this._applyTitle(this.state.titleContext.title, this.state.titleContext.withAppName);
        }
    }
    public componentWillUnmount() {
        window.removeEventListener("error", this._onGlobalError);
        window.removeEventListener("unhandledrejection", this._onGlobalError);
    }
}


interface ILocalizationProgressSnakbarProps {
    language: string;
    progress?: LocalizationProgress;
}

const LocalizationProgressSnakbar: React.FC<ILocalizationProgressSnakbarProps> = (props) => {
    const { language, progress } = props;
    const [dismissedLanguage, setDismissedLanguage] = React.useState<string | undefined>();
    let message: React.ReactNode;
    if (dismissedLanguage !== language) {
        switch (progress) {
            case "none":
                message = "Sorry. No translation available for the user interface (UI).";
                break;
            case "machine-translation":
                message = <>
                    To make this app accessible to as many readers as possible, user interface (UI) for language <strong>{language}
                    </strong> has been translated with machine translation (MT).
            </>;
                break;
            case "partial-machine-translation":
                message = <>
                    To make this app accessible to as many readers as possible, some part of the user interface (UI) for language <strong>{language}
                    </strong> has been translated with machine translation (MT).
            </>;
                break;
        }
    }
    return <Snackbar open={!!message} message={message} action={<>
        <Button
            color="inherit"
            size="small"
            href="https://github.com/crystal-pool/warriors-family-tree/tree/master/src/localization/prompts#readme"
            target="_blank"
        >Help with the translations!</Button>
        <IconButton
            aria-label="close"
            color="inherit"
            onClick={() => setDismissedLanguage(props.language)}
        >
            <Icons.Close />
        </IconButton>
    </>
    } />;
};
