require('dotenv').config();
const puppeteer = require('puppeteer');
const linkedinArr = require('./profiles');

const initPuppeteer = async () => {
  // Viewport && Window size (this is set so that selectors don't change because of media queries)
  const width = 1500;
  const height = 1000;

  const browser = await puppeteer.launch({
    headless: false, // make true if you don't want to watch
    args: [`--window-size=${width},${height}`],
    defaultViewport: {
      width,
      height,
    },
  });
  return browser;
};

const prepareArray = (linkedinArr) => {
  // clean all elements, specialize the first
  const newArr = linkedinArr.map((linkStr, i) => {
    // if string is www, add https://
    const httpStr = linkStr[0] === 'w' ? 'https://' + linkStr : linkStr;
    // remove / from end
    const cleanStr =
      httpStr[httpStr.length - 1] === '/' ? httpStr.slice(0, -1) : httpStr;
    // split by /s
    const splitStr = cleanStr.split('/');
    // get username as last element
    const user = splitStr[splitStr.length - 1];

    // if first link, create link to sign in. else, use clean string
    return i === 0
      ? 'https://www.linkedin.com/checkpoint/rm/sign-in-another-account?session_redirect=https%3A%2F%2Fwww%2Elinkedin%2Ecom%2Fin%2F' +
          user +
          '&fromSignIn=true'
      : cleanStr;
  });

  return newArr;
};

const connectAndEndorse = async (browser, link, iter) => {
  // create new tab
  const page = await browser.newPage();

  // set up listener to log out anything we "console.log"
  page.on('console', (msg) => {
    for (let i = 0; i < msg._args.length; ++i)
      console.log(`${i}: ${msg._args[i]}`);
  });

  // navigate to url
  await page.goto(link);

  // log in if first link, then return out to links we care about
  if (iter === 0) {
    await page.waitForNetworkIdle();
    // login to linkedin
    await page.type('#username', process.env.LINKEDINUSERNAME);
    await page.type('#password', process.env.LINKEDINPASSWORD);
    // submit
    await page.click('[type=submit]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    return;
  }

  // await page.waitForNetworkIdle();
  await page.waitForSelector('.entry-point');
  console.log('ENTRY POINT FOUND');

  const asyncWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // make connection and return if a message should be send and if skills should be endorsed
  console.log(1);
  let [sendMsg, endorseSkills] = await page.evaluate(async () => {
    const asyncWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await asyncWait(3000);

    // if connected, move on to skills
    if (
      document
        .evaluate(
          "//*[@class='display-flex align-items-center  artdeco-dropdown__item artdeco-dropdown__item--is-dropdown ember-view']//span[contains(., 'Remove Connection')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
    ) {
      return [false, true];

      // if pending, skip skills
    } else if (
      document
        .evaluate(
          "//button/span[contains(., 'Pending')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
    ) {
      return [false, false];
    }

    // if accept, click accept and then go endorse
    else if (
      document
        .evaluate(
          "//button/span[contains(., 'Accept')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
    ) {
      document
        .evaluate(
          "//button/span[contains(., 'Accept')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
        .click();
      return [false, true];
    }
    // else, initiate conection
    else {
      console.log(2);
      // locate button to click to connect (could be in one of 2 places), and click it
      document
        .evaluate(
          "//*[@class='pv-profile-sticky-header-v2__container pv1']//button/span[contains(., 'Connect')]|//*[@class='display-flex align-items-center  artdeco-dropdown__item artdeco-dropdown__item--is-dropdown ember-view']//span[contains(., 'Invite')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
        .click();

      // if linkedin is asking how you know this person, get through that
      console.log(3);
      if (
        document
          .evaluate(
            "//*[@id='artdeco-modal-outlet']//button[contains(., 'Classmates')]",
            document,
            null,
            XPathResult.ANY_TYPE,
            null
          )
          .iterateNext()
      ) {
        await asyncWait(200);
        console.log(4);
        document
          .evaluate(
            "//*[@id='artdeco-modal-outlet']//button[contains(., 'Classmates')]",
            document,
            null,
            XPathResult.ANY_TYPE,
            null
          )
          .iterateNext()
          .click();
        await asyncWait(200);
        console.log(5);
        document
          .evaluate(
            "//*[@id='artdeco-modal-outlet']//button[contains(., 'Connect')]",
            document,
            null,
            XPathResult.ANY_TYPE,
            null
          )
          .iterateNext()
          .click();
        console.log(6);
      }

      // add a note for fun and flare
      await asyncWait(200);
      console.log(7);
      document
        .evaluate(
          "//*[@id='artdeco-modal-outlet']//button[contains(., 'Add a note')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
        .click();
    }

    return [true, false];
  });

  console.log(8, sendMsg);
  await asyncWait(200);

  if (sendMsg) {
    console.log(9);
    await page.type(
      '#custom-message',
      'Hello! This is an automated connection request. Hope it works!'
    );

    console.log(10);
    await page.evaluate(() => {
      // send our invite :)
      document
        .evaluate(
          "//*[@id='artdeco-modal-outlet']//button[contains(., 'Send')]",
          document,
          null,
          XPathResult.ANY_TYPE,
          null
        )
        .iterateNext()
        .click();
    });
  }
  console.log(11);

  if (endorseSkills) {
    console.log(12);
    // navigate to skills page
    await page.goto(link + '/details/skills/');
    console.log('before navigation');
    await page.waitForSelector('.pvs-list,.artdeco-empty-state__message');
    console.log('past navigation');

    // now endorse!
    await page.evaluate(() => {
      // credit to Julia, Mike, and Augusto for the below code. You sparked the idea to create this repo!
      setTimeout(async () => {
        // Once on the skills page, scroll to the bottom:
        let prev = 0;
        let cur = document.body.scrollHeight;
        while (cur !== prev) {
          window.scrollTo(0, document.body.scrollHeight);
          await asyncWait(500);
          prev = cur;
          cur = document.body.scrollHeight;
          if (cur === prev) break;
        }
        // Locate all skills buttons and click them:
        var skills = document.querySelectorAll('.pv2 > .artdeco-button--muted');
        for (var i = 0; i < skills.length; ++i) {
          if (skills[i].innerText === 'Endorse') {
            console.log(skills[i]);
            skills[i].click();
          }
        }
      }, 2000);
    });
  }
};

const main = async (linkedinArr) => {
  // initialize puppeteer
  const browser = await initPuppeteer();
  // clean array from profiles.js
  const preppedLinkedInArr = prepareArray(linkedinArr);
  // loop through links and do stuff
  for (let i = 0; i < preppedLinkedInArr.length; i++) {
    const link = preppedLinkedInArr[i];
    console.log('---------');
    console.log(link);
    console.log('---------');
    await connectAndEndorse(browser, link, i);
  }
};

main(linkedinArr);
