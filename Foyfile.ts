import { task, desc, option, fs, setGlobalOptions } from "foy";
setGlobalOptions({ loading: false });

task("build", async (ctx) => {
  // await ctx.exec(`tsc`)
  await ctx.exec(`vite build`);
  await fs.rmrf("/mnt/d/Projects/cordova-memo/www");
});

task("build:android", ['build'], async (ctx) => {
  await fs.copy("./docs", "/mnt/d/Projects/cordova-memo/www");
  await ctx
    .cd('/mnt/d/Projects/cordova-memo')
    .exec('powershell.exe -c "cordova run android"');
});

const TestCmd = `jasmine --require=./test/register.js './test/*.test.ts'`;
task("test", async (ctx) => {
  // Your build tasks
  await ctx.exec(`nyc --reporter=html ${TestCmd}`);
});

task("test:debug", async (ctx) => {
  await ctx
    .env("UPDATE_SNAPS", "1")
    .exec(`node --inspect-brk=9230 ./node_modules/.bin/${TestCmd}`);
});

task("update-snaps", async (ctx) => {
  await ctx.env("UPDATE_SNAPS", "1").exec(`${TestCmd}`);
});
