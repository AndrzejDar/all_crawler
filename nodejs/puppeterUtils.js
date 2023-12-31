import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import randomUseragent from "user-agents";
import { executablePath } from "puppeteer";

const browserOptions = {
  executablePath: executablePath(),
  // headless: true,
  headless: "new", // causes some errors
  protocolTimeout: 60000,
  timeout: 30000,
  devtools: false,
  ignoreHTTPSErrors: true,
  // userDataDir: "./tmp", //to persist data beetwen runs
  slowMo: 0,
  args: [
    "--disable-gpu",
    "--no-sandbox", //heroku
    "--no-zygote",
    "--disable-setuid-sandbox",
    "--disable-accelerated-2d-canvas",
    "--disable-dev-shm-usage",
    "--proxy-server='direct://'",
    "--proxy-bypass-list=*",
    "--disable-setuid-sandbox", //heroku
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
  ],
};

export class PuppeteerManager {
  constructor() {
    this.browser = null;
    this.retries = 0;
    this.isReleased = false;
    this.userAgent = null;
    this.error = false;
  }

  async init() {
    this.isReleased = false;
    this.retries = 0;
    this.browser = await this.runBrowser();
    this.userAgent = new randomUseragent();
    this.error = false;
  }

  async release() {
    this.isReleased = true;
    try {
      if (this.browser) {
        console.log(" -  releasing browser");
        await this.browser.close();
      }
    } catch (e) {
      console.log("!!!Browser crasched during release", e);
    }
  }

  async createPageFromUrl(url) {
    await delay(Math.random() * 2000);
    if (!this.browser) this.browser = await this.runBrowser();
    let page = null;
    this.retries = 0;
    while (this.retries < 20) {
      try {
        page = await this.createPage(this.browser, url, this.userAgent);
        return page;
      } catch (error) {
        console.log(
          " ! ",
          this.retries,
          " - failed creating page. Switching userAgent and retrying.",
          error.message
        );
        this.error = false;
        page = null;
        this.userAgent = new randomUseragent();
        this.retries += 1;
        await delay(Math.random() * 5000);
        // console.log("!switching user agent");
      }
    }
    console.log(`!!!failed all retries creating page on url: ${url}`);
    return null;
  }

  async retryLaunchBrowser(puppeteer, retries) {
    for (let i = 0; i < retries; i++) {
      let bw = null;
      try {
        bw = await puppeteer.launch(browserOptions);
        return bw;
      } catch (e) {
        console.log("!!! Failed lunching browser", "try nr", i, e);
        console.log("!!! closing browser gracefully");
        if (bw) await this.release();
        await delay(30000);
      } finally {
      }
    }
    return null;
  }

  async runBrowser() {
    console.log(" -  initializing new browser");
    await delay(4000);
    puppeteer.use(StealthPlugin());
    const bw = await this.retryLaunchBrowser(puppeteer, 10);

    bw.on("disconnected", async () => {
      if (this.isReleased) return;
      console.log("BROWSER CRASH");
      if (this.retries <= 10) {
        this.retries += 1;
        if (this.browser && this.browser.process() != null) {
          console.log("!!!Closing/killing browser process");
          await this.browser.close();
          this.browser.process().kill("SIGINT");
        }
        await this.init();
      } else {
        throw "===================== BROWSER crashed more than 10 times";
      }
    });

    return bw;
  }

  async createPage(browser, url) {
    const page = await browser.newPage();
    await this.pageSetup(page);
    try {
      this.pageInterceptionSetup(page);
    } catch (e) {
      throw new Error(e.message);
    }
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });
    if (this.error) throw new Error("interceptor error:"); //need better solution to catch errors from interceptor from page object

    const mainFrame = page.mainFrame();
    if (!mainFrame) {
      throw new Error("! navigation detached");
    }
    // await page.screenshot({ path: "image3.png" });
    return page;
  }

  async pageSetup(page) {
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    // console.log(this.userAgent.toString());
    await page.setUserAgent(this.userAgent.toString());
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);
    // await page.setGeolocation({ latitude: 52.21859, longitude: 20.9711 });

    await page.setExtraHTTPHeaders({
      "upgrade-insecure-requests": "1",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-US,en;q=0.9,en;q=0.8",
    });

    await page.setRequestInterception(true);
  }

  async pageInterceptionSetup(page) {
    try {
      //TO DO: disable all requests except first one

      await page.on("request", async (req) => {
        if (
          req.resourceType() == "stylesheet" ||
          req.resourceType() == "font" ||
          req.resourceType() == "image"
          // req.url().includes("assets.allegrostatic.com")
        ) {
          if (!req.isInterceptResolutionHandled()) {
            await req.abort();
          }
          return;
        }
        // console.log("    page requested: ", req.url());
        try {
          if (req.url().includes("captcha-delivery.com")) {
            if (!req.isInterceptResolutionHandled()) {
              await req.abort();
              throw new Error("-----------Blocked by Datadome---------------"); //Reject when event hapens
            }
            return;
          }
          if (req.url().includes("skycaptcha")) {
            if (!req.isInterceptResolutionHandled()) {
              await req.abort();
              throw new Error(
                "-----------Blocked by Skycaptcha---------------"
              ); //Reject when event hapens
            }
            return;
          }
          if (req.url().includes("allegro.pl/captcha")) {
            if (!req.isInterceptResolutionHandled()) {
              await req.abort();
              throw new Error(
                "-----------Blocked by Rate Limiter---------------"
              ); //Reject when event hapens
            }
            return;
          }
          if (!req.isInterceptResolutionHandled()) {
            await req.continue();
          }
          return;
        } catch (e) {
          if (e.message) console.log(e.message);
          else console.log(e);
          this.error = true;
        }
      });

      await page.evaluateOnNewDocument(() => {
        // Pass webdriver check
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
      });

      await page.evaluateOnNewDocument(() => {
        // Pass chrome check
        window.chrome = {
          runtime: {},
          // etc.
        };
      });

      await page.evaluateOnNewDocument(() => {
        //Pass notifications check
        const originalQuery = window.navigator.permissions.query;
        return (window.navigator.permissions.query = (parameters) =>
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters));
      });

      await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });
      });

      await page.evaluateOnNewDocument(() => {
        // Overwrite the `languages` property to use a custom getter.
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });
      });
    } catch (e) {
      console.log(e);
      throw new Error("! error seting up interceptors");
    }
  }
}

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

//https://brightdata.com/lp/scraping-browser-acf?pscd=get.brightdata.com&ps_partner_key=c3VuaWxzYW5kaHUzNzU2&sid=c001&ps_xid=3kcSe4K7pYLdGN&gsxid=3kcSe4K7pYLdGN&gspk=c3VuaWxzYW5kaHUzNzU2&utm_source=affiliates&utm_campaign=c3VuaWxzYW5kaHUzNzU2

//!!!!!!!!!!!!!!!!!!!!!!!!! https://gist.github.com/tegansnyder/c3aeae4d57768c58247ae6c4e5acd3d1 !!!!!!!!!!!!!!!!!!!!!!!!!

// https://intoli.com/blog/making-chrome-headless-undetectable/

// how Datadomedetects headles:
// https://antoinevastel.com/bot%20detection/2018/01/17/detect-chrome-headless-v2.html

// all depends ou useAgent:
//blocked:
// Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1

//allowed:
// Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36
