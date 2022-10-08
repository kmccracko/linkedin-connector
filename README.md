# How to use

This repo uses [puppeteer](https://pptr.dev/) to log in to linkedin, open up a profile tab, make a connection if possible, and endorse skills if possible. If you want to watch, you can leave the "headless" option as false.

Please know: This script takes a while! Certainly faster than you doing it by hand, but we do still have to wait for pages to load.

### The Bare Minimum

1. `npm i`
2. Create a '.env' file with the keys of `LINKEDINUSERNAME`, `LINKEDINPASSWORD`, and `MYLINKEDIN`. It should look like this:

```
MYLINKEDIN=https://www.linkedin.com/in/this-is-my-name/
LINKEDINUSERNAME=thisISmyUSERname
LINKEDINPASSWORD=$uper$ecretpa$$word!
```

Fill out the `MYLINKEDIN` variable with your own linkedin url. We use your own profile as the first link to sign in to linkedin, so we don't run into snags when we open other pages.

4. To launch the script, run `npm run start` in your terminal.

### Updating the LinkedIn Array

Open slack in browser. Visit the linkedin channel.
Inspect the page. Scroll all the way up (to load everything).
Run the following commands in the developer console:

```javascript
// select all chat links, ignore names
a = document.querySelectorAll('.c-link:not(.c-timestamp):not(.c-member_slug)');
b = [];
a.forEach((el) => {
  if (el.innerText.split('.').includes('linkedin')) b.push(el.innerText);
});
// log array
b;
```

Copy out all elements from b and update the `linkedInArr` found in profiles.js.

Be sure not to somehow remove the `MYLINKEDIN` variable, or else your computer will explode.
Also be sure to not include your own linkedin anywhere except for the first item. Or else explosion.

# Fun facts

While building and testing this, linkedin picked up on bot behavior (good job linkedin!) and started giving me captchas, which renders this script useless. After waiting a day I stopped getting captchas and was able to wrap up this build. If it seems unoptimized, it probably is! Testing is troublesome when you're blocked from doing so.
Either way, you shouldn't run into this unless you rerun this a bunch of times in a short span of time.

You can't endorse people for skills if you aren't connected yet. This means the script should be run once, and then once again some time later (after people can respond to your connection requests).

This script is going to open a whole bunch of tabs. If you don't want that to happen, consider running the script with segments of the linkedin array commented out, so that you're running batches instead of the whole thing. Just be sure to keep the `MYLINKEDIN` variable uncommented, or else explosions.

This script might break for you; it hasn't been tested very thoroughly.

The lighter was invented before the match.

Chess was invented before checkers.

Cows can go up stairs but not down.

---

If you have another fun fact for this repo, feel free to make a PR.
