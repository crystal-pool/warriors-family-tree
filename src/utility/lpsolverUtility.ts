import { IModel, ReformatLP } from "javascript-lp-solver";

export type Polynomial = Record<string, number | null | undefined>;
export type Contraint = [Polynomial, "<=" | "=" | ">=", number];

export function buildPolynomial(obj: Polynomial, rhs?: (string | number)[], lhs?: (string | number)[]): string {
    const builder: (string | number)[] = lhs ? [...lhs] : [];
    for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
            const coeff = obj[k];
            if (coeff != null) {
                builder.push(coeff);
                builder.push(k);
            }
        }
    }
    if (rhs) builder.push(...rhs);
    return builder.join(" ");
}

export interface ILPModel {
    objective: Polynomial;
    opType: "min" | "max";
    constraints?: Contraint[];
    intVariables?: string[];
}

export function buildLPModel(model: ILPModel): string[] {
    const expr: string[] = [];
    expr.push(buildPolynomial(model.objective, undefined, [model.opType + ":"]));
    if (model.constraints) {
        for (const [lhs, op, rhs] of model.constraints) {
            expr.push(buildPolynomial(lhs, [op, rhs]));
        }
    }
    if (model.intVariables) {
        for (const vn of model.intVariables) {
            expr.push("int " + vn);
        }
    }
    return expr;
}

export function buildJSLPModel(model: ILPModel): IModel {
    return ReformatLP(buildLPModel(model));
}

export function dumpLPModel(model: ILPModel): string {
    return buildLPModel(model).join(";\n") + ";\n";
}
