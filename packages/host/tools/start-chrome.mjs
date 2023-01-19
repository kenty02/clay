// start chrome
import {execFile} from "child_process";
import fs from "fs";

const userDataDir = "./debug-chrome-user-data";
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir);
}
const userDataDirAbs = fs.realpathSync(userDataDir);
var chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
var args = [
  "--remote-debugging-port=9222",
  `--user-data-dir=${userDataDirAbs}`
]
  .concat(process.argv.slice(2));

// on ctrl+c, kill chrome
process.on('SIGINT', function () {
  if (proc != null)
    process.kill(proc.pid)
  process.exit();
})
let proc;

await new Promise((resolve) => {
  proc = execFile(chrome, args, function (err, stdout, stderr) {
      if (err) {
        console.log(err);
      }
      resolve()
    }
  )
})
