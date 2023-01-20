// start chrome
import {execFile, spawnSync} from "child_process";
import fs from "fs";


var proxy = "./tools/chrome-rdb-proxy.exe";
const isUsingProxy = fs.existsSync(proxy)
if (isUsingProxy) {
  console.log(`Using ${proxy}`);
} else {
  console.log(`Not using ${proxy} (not found)`);
}
const remoteDebugginrPort = 9222
const chromeRemoteDebuggingPort = isUsingProxy ? 9221 : remoteDebugginrPort;

const userDataDir = "./debug-chrome-user-data";
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir);
}
const userDataDirAbs = fs.realpathSync(userDataDir);
var chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
var args = [
  `--remote-debugging-port=${chromeRemoteDebuggingPort}`,
  `--user-data-dir=${userDataDirAbs}`
]
  .concat(process.argv.slice(2));

const killProc = () => {
  if (proc != null) {
    /*
        try {
          process.kill(proc.pid, "SIGINT")
        } catch (e) {
        }
    */

    try {
      // 正常な終了がされない
      // https://github.com/GoogleChrome/chrome-launcher/issues/266
      const taskkillProc = spawnSync(
        `taskkill /pid ${proc.pid} /T /F`, {shell: true, encoding: 'utf-8'});
    } catch (e) {
    }
  }
}

// on ctrl+c, kill chrome
process.on('SIGINT', function () {
  killProc();
  try {
    if (proxyProc != null)
      process.kill(proxyProc.pid)
  } catch (e) {
  }
  process.exit();
})
let proc;
let proxyProc;
let abnormalExit = false;

await new Promise((resolve) => {
  proc = execFile(chrome, args, function (err, stdout, stderr) {
      if (err) {
        console.log(err);
        abnormalExit = true;
      }
      try {
        if (proxyProc != null)
          process.kill(proxyProc.pid)
      } catch {
      }
      resolve()
    }
  )
  if (isUsingProxy) {
    proxyProc = execFile(proxy, [], function (err, stdout, stderr) {
        if (err) {
          console.log(err);
          abnormalExit = true;
        }
        killProc();
        // multiple resolve calls are ignored
        resolve()
      }
    )
  }
})
if (abnormalExit)
  process.exit(1)
