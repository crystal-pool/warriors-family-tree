declare module "javascript-lp-solver" {
    export interface IModelConstraint {
        min?: number;
        max?: number;
        equal?: number;
    }
    export interface IModelOptions {
        tolerance?: number;
        timeout?: number;
    }
    export interface IModel<TSolutionVar extends string = string, TInternalVar extends string = string> {
        optimize: (TSolutionVar | TInternalVar);
        opType: "max" | "min";
        constraints: { [variable in (TSolutionVar | TInternalVar)]?: IModelConstraint };
        variables: { [variable in TSolutionVar]?: { [variable in (TSolutionVar | TInternalVar)]?: number } };
        ints?: { [variable in (TSolutionVar | TInternalVar)]?: boolean | 0 | 1 };
        options?: IModelOptions;
    }
    export interface ISolutionBase {
        feasible: boolean;
        result: number;
        bounded?: boolean;
        isIntegral?: boolean;
    }
    export type Solution<TSolutionVar extends string> = ISolutionBase & { [variable in TSolutionVar]: number };
    export function Solve<TSolutionVar extends string, TInternalVar extends string>(model: IModel<TSolutionVar, TInternalVar>, precision?: number, full?: boolean, validate?: unknown): Solution<TSolutionVar>;
    export function ReformatLP(model: string[]): IModel;
    export function ReformatLP(model: IModel<any, any>): string;
}