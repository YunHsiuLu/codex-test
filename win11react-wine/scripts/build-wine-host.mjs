import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
const cargoHome = path.join(root, "work/cargo");
if (existsSync(path.join(cargoHome, "bin/rustc"))) {
  env.CARGO_HOME = cargoHome; env.RUSTUP_HOME = path.join(root, "work/rustup");
  env.PATH = `${cargoHome}/bin:${env.PATH}`;
}
const rustc = (...args) => execFileSync("rustc", args, {cwd:root, env, encoding:"utf8"}).trim();
const sysroot = rustc("--print", "sysroot");
const host = rustc("-vV").match(/^host: (.+)$/m)[1];
const linker = path.join(sysroot, "lib/rustlib", host, "bin/rust-lld");
const output = path.join(root, "src-tauri/resources");
const scratch = path.join(root, "work/host-build");
const source = path.join(root, "native/windows-host");
mkdirSync(output, {recursive:true}); mkdirSync(scratch, {recursive:true});
env.DYLD_LIBRARY_PATH = path.join(sysroot, "lib") + (env.DYLD_LIBRARY_PATH ? `:${env.DYLD_LIBRARY_PATH}` : "");
const run = (cmd,args) => execFileSync(cmd,args,{cwd:root,env,stdio:"inherit"});
// Generate import libraries from our own symbol lists, without shipping any DLL.
for (const name of ["kernel32", "user32", "gdi32", "shell32"]) {
  run(linker, ["-flavor","link","/dll","/noentry","/machine:x64",`/def:${source}/${name}.def`,`/out:${scratch}/${name}.dll`,`/implib:${scratch}/${name}.lib`]);
}
for (const [name, src, flags, libraries, subsystem] of [
  ["wine-host", "host.c", [], ["kernel32","user32","gdi32","shell32"], "console"],
]) {
  const obj = path.join(scratch, `${name}.obj`);
  run("clang", ["--target=x86_64-pc-windows-msvc","-c","-Os","-ffreestanding","-fno-stack-protector","-Werror",...flags,path.join(source,src),"-o",obj]);
  run(linker, ["-flavor","link","/machine:x64","/entry:mainCRTStartup",`/subsystem:${subsystem}`,"/nodefaultlib","/timestamp:0",`/out:${output}/${name}.exe`,obj,...libraries.map(n=>`${scratch}/${n}.lib`)]);
}
console.log("Built Windows GDI view host.");
const dllObj = path.join(scratch,"display.obj");
run("clang", ["--target=x86_64-pc-windows-msvc","-c","-Os","-ffreestanding","-fno-stack-protector","-Werror","-DHOST_DLL",path.join(source,"host.c"),"-o",dllObj]);
run(linker, ["-flavor","link","/dll","/machine:x64","/entry:DllMain","/nodefaultlib","/timestamp:0",`/out:${output}/wine-display.dll`,dllObj,...["kernel32","user32","gdi32","shell32"].map(n=>`${scratch}/${n}.lib`)]);
