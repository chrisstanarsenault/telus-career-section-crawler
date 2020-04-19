# Telus Career Board Crawler

My first webcrawler I built, which crawls the [Telus career section](https://www.telus.com/en/digital/careers/) for any new Junior developer positions in my area. If found, puts them into a table format, and emails them to me. Checks once every 6 hours.

This is also built as a script with a .plist script also calling this within LaunchDaemon so it can be running behind the scenes while my server is active.

App is checking to see if it has hit the 6hour mark whenever server wakes up by checking the "timestamp" file and checking against the time inside it. If it has been 6 hours, runs scrape and updates time inside the file with the new current time.

**_Built with Node/JS and [Cheerio](https://cheerio.js.org/)._**
