import { Button, Card, CardActions, CardContent } from "@material-ui/core";
import React from "react";
import { useLocation } from "react-router-dom";
import { resourceManager } from "../../localization";
import { routePathBuilders } from "../../pages";
import { RdfQName } from "../../services/dataService";
import { RdfEntityDescription, RdfEntityLabel } from "../RdfEntity";

export interface IDefaultCardProps {
    qName: RdfQName;
}

export const DefaultCard: React.FC<IDefaultCardProps> = React.memo((props) => {
    const loc = useLocation();
    return (<Card>
        <CardContent>
            <h3>
                <RdfEntityLabel qName={props.qName} variant="plain-with-id-link" />
            </h3>
            <p><RdfEntityDescription qName={props.qName} /></p>
            <p>{resourceManager.getPrompt("EntityNotFound1", [props.qName])}</p>
            <p>{resourceManager.renderPrompt("HoweverCheckout1", [<strong key={0}>{resourceManager.getPrompt("EntityProfileTitle")}</strong>])}</p>
        </CardContent>
        <CardActions>
            <Button href={routePathBuilders.entityProfile({ qName: props.qName }, loc.search)}>{resourceManager.getPrompt("EntityProfileTitle")}</Button>
        </CardActions>
    </Card>);
});
