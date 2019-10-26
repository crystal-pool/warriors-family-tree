import child_process from "child_process";
import { PromiseResolutionSource } from "tasklike-promise-library";

/**
 * Gets the current git HEAD value.
 */
export function getGitHead(): Promise<string> {
    const prs = new PromiseResolutionSource<string>();
    child_process.exec("git rev-parse HEAD", {
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
