import { describe, expect, it } from "@jest/globals";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const rootPackageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const packageName = rootPackageJson.name;

const suiteTitle = "Package installation integrity";
const pnpmCommand = "pnpm";
const packDestinationFlag = "--pack-destination";
const tarballExtension = ".tgz";
const sanitizedPackageName = packageName
  .replace(/[@/]/g, "-")
  .replace(/^-/, "");
const projectPrefix = `${sanitizedPackageName}-project-`;
const tarballPrefix = `${sanitizedPackageName}-tarball-`;
const packageJsonFile = "package.json";
const dependencySection = "devDependencies";
const tarballErrorMessage = "Failed to locate generated tarball.";

const createTemporaryDirectory = (prefix: string): string => {
  return mkdtempSync(join(tmpdir(), prefix));
};

describe(suiteTitle, () => {
  it("packs and installs successfully in a clean project", () => {
    const tarballDirectory = createTemporaryDirectory(tarballPrefix);
    const projectDirectory = createTemporaryDirectory(projectPrefix);

    try {
      execFileSync(
        pnpmCommand,
        ["pack", packDestinationFlag, tarballDirectory],
        { stdio: "inherit" }
      );
      const tarballName = readdirSync(tarballDirectory).find((file) =>
        file.endsWith(tarballExtension)
      );
      if (tarballName === undefined) {
        throw new Error(tarballErrorMessage);
      }
      const tarballPath = join(tarballDirectory, tarballName);

      const initialPackageJson = {
        name: "test-installation",
        version: "1.0.0",
      };
      writeFileSync(
        join(projectDirectory, packageJsonFile),
        JSON.stringify(initialPackageJson, null, 2)
      );
      execFileSync(pnpmCommand, ["add", "--save-dev", tarballPath], {
        cwd: projectDirectory,
        stdio: "inherit",
      });

      const packageJsonPath = join(projectDirectory, packageJsonFile);
      const packageJson = JSON.parse(
        readFileSync(packageJsonPath, "utf-8")
      ) as Record<string, unknown>;
      const devDependencies =
        (packageJson[dependencySection] as
          | Record<string, string>
          | undefined) ?? {};
      expect(devDependencies[packageName]).toBeDefined();
    } finally {
      rmSync(tarballDirectory, { recursive: true, force: true });
      rmSync(projectDirectory, { recursive: true, force: true });
    }
  });
});
