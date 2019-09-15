import { Link } from "@material-ui/core";
import * as React from "react";
import { dataService } from "../services";
import { tryGetFullUri } from "../services/dataConfig";
import { RdfQName } from "../services/dataService";

export interface IRdfEntityLinkProps {
    qName: RdfQName;
}

export const RdfEntityLink: React.FC<IRdfEntityLinkProps> = (props) => {
    const uri = props.qName && tryGetFullUri(props.qName);
    return uri
        ? <Link className="entity-id entity-uri-link" href={uri}>{props.qName}</Link>
        : <span className="entity-id entity-not-expandable">{props.qName}</span>;
};

export interface IRdfEntityLabelProps {
    qName: RdfQName;
    fallbackContent?: React.ReactNode;
    showEntityId?: boolean;
}

export const RdfEntityLabel: React.FC<IRdfEntityLabelProps> = (props) => {
    const [label, setLabel] = React.useState(() => dataService.getLabelFor(props.qName));
    React.useEffect(() => {
        const subscription = dataService.onLanguageChanged(() => {
            setLabel(dataService.getLabelFor(props.qName));
        });
        return subscription.dispose.bind(subscription);
    });
    React.useEffect(() => {
        setLabel(dataService.getLabelFor(props.qName));
    }, [props.qName]);
    return (<span>
        <span className="entity-label">{label && label.label || props.fallbackContent}</span>
        {props.showEntityId && (<React.Fragment>
            {" "}
            <span className="entity-id-container">(<RdfEntityLink qName={props.qName} />)</span>
        </React.Fragment>)}
    </span>);
};

export interface IRdfEntityDescriptionProps {
    qName: RdfQName;
    fallbackContent?: React.ReactNode;
}

export const RdfEntityDescription: React.FC<IRdfEntityDescriptionProps> = (props) => {
    const [label, setLabel] = React.useState(() => dataService.getLabelFor(props.qName));
    React.useEffect(() => {
        const subscription = dataService.onLanguageChanged(() => {
            setLabel(dataService.getLabelFor(props.qName));
        });
        return subscription.dispose.bind(subscription);
    });
    React.useEffect(() => {
        setLabel(dataService.getLabelFor(props.qName));
    }, [props.qName]);
    return <span>{label && label.description || props.fallbackContent}</span>;
};
