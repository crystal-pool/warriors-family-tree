import * as React from 'react'
import { AppModel } from './appModel';
import { Button } from '@material-ui/core';

export interface IAppProps {
    model: AppModel;
}

export class App extends React.PureComponent<IAppProps> {
    public render(): React.ReactNode {
        return (
            <React.Fragment>
                <p>Test!</p>
                <Button variant="contained" color="primary">Test</Button>
            </React.Fragment>
        );
    }
}
