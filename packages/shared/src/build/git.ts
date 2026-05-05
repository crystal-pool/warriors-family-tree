import child_process from "child_process";

function invokeGit(params: string, cwd: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        child_process.exec("git " + params, { cwd }, (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/**
 * Gets the current git HEAD value.
 */
export function getGitHead(cwd: string): Promise<string> {
    return invokeGit("rev-parse HEAD", cwd);
}

export async function getGitVersionSpec(cwd: string): Promise<string> {
    const tagSpec = await invokeGit(`describe --tags --match "v-*"`, cwd);
    return tagSpec;
}
