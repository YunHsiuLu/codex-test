import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const cargoHome = path.join(root, "work/cargo");
if (existsSync(path.join(cargoHome, "bin/cargo"))) {
  env.CARGO_HOME = cargoHome;
  env.RUSTUP_HOME = path.join(root, "work/rustup");
  env.PATH = `${cargoHome}/bin:${env.PATH}`;
}
// Development keeps Wine prefixes inside the project. Packaged apps use app data.
if (process.argv[2] === "dev") env.WIN11_DATA_DIR ||= path.join(root, ".local-data");
const portableWine = path.join(root, "work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine");
if (process.argv[2] === "dev" && existsSync(portableWine)) env.WIN11_WINE ||= portableWine;
const testing = process.argv[2] === "test";
const executable = testing ? "cargo" : path.join(root, "node_modules/.bin/tauri");
const args = testing ? ["test", "--manifest-path", "src-tauri/Cargo.toml", ...process.argv.slice(3)] : process.argv.slice(2);
const child = spawn(executable, args, { cwd: root, env, stdio: "inherit" });
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
