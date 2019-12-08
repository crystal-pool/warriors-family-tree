import child_process from "child_process";
import { PromiseResolutionSource } from "tasklike-promise-library";

function invokeGit(params: string): Promise<string> {
    const prs = new PromiseResolutionSource<string>();
    child_process.exec("git " + params, {
        cwd: __dirname
    }, (error, stdout) => {
        if (error) {
            prs.tryReject(error);
        } else {
            prs.tryResolve(stdout.trim());
        }
    });
    return prs.promise;
}

/**
 * Gets the current git HEAD value.
 */
export function getGitHead(): Promise<string> {
    return invokeGit("rev-parse HEAD");
}

export async function getGitVersionSpec(): Promise<string> {
    const tagSpec = await invokeGit(`describe --tags --match "v-*"`);
    return tagSpec;
}
