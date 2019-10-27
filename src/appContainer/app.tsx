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

export const App: React.FC<IAppProps> = (props) => {
    const [language, setLanguage] = React.useState(browserLanguage);
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
    return (
        <HashRouter>
            <LanguageContext.Provider value={{ language, setLanguage: onSetLanguage }}>
                <Route component={RouteRoot} />
            </LanguageContext.Provider>
        </HashRouter>
    );
};
