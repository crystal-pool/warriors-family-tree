import * as React from 'react'
import { AppModel } from './appModel';

export interface IAppProps {
    model: AppModel;
}

export class App extends React.PureComponent<IAppProps> {
    public render(): React.ReactNode {
        return (<p>Test!</p>);
    }
}
