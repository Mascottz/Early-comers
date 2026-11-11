import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Local sandboxes can point Remotion at a Chrome build that is already on disk.
// CI leaves this unset and lets `npx remotion browser ensure` fetch the official
// chrome-headless-shell instead.
const localBrowser = process.env.REMOTION_BROWSER_EXECUTABLE;
if (localBrowser) {
  Config.setBrowserExecutable(localBrowser);
}
