import { task, desc, option, fs, setGlobalOptions } from "foy";
const TestCmd = `jasmine --require=./test/register.js './test/*.test.ts'`;
setGlobalOptions({ loading: false })
task("test", async (ctx) => {
  // Your build tasks
  await ctx.exec(`nyc --reporter=html ${TestCmd}`);
});

task('test:debug', async ctx => {
    await ctx.env('UPDATE_SNAPS', '1').exec(`node --inspect-brk=9230 ./node_modules/.bin/${TestCmd}`)
})

task('update-snaps', async ctx => {
    await ctx.env('UPDATE_SNAPS', '1').exec(`${TestCmd}`)
})
