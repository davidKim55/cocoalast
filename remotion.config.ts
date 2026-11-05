import { Config } from "@remotion/cli/config";

// Use the Chromium headless shell that ships with this machine's Playwright install.
const shell = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
import fs from "fs";
if (fs.existsSync(shell)) Config.setBrowserExecutable(shell);
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
