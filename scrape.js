require("dotenv").config();
const nodemailer = require("nodemailer");
const cheerio = require("cheerio");
const axios = require("axios");
const moment = require("moment");
const fs = require("fs");

//this var is for testing outside of LaunchDaemon
let tfileLocation = "./timestamp.file";
// this var is for running with LaunchDaemon
let fileLocation =
  "Users/chrisarsenault/Desktop/Dev/WebDev/Projects/webscrape/telus-job-scrape/timestamp.file";
const contents = fs.readFileSync(fileLocation, "utf-8");

// checks timestamp file, and checks if it has been 6hours since
// last scrape, and if so, runs scrape and writes the new time inside the file
// to check against for next round.
if (!contents || Date.now() - contents > 5000) {
  fs.writeFileSync(fileLocation, Date.now().toString());
  checkTimestampAndScrape();
}

// keep this log here so you can see in the daemon log output
// that is checking every 3 mins per the .plist file and that
// you are not going crazy
console.log("Checked at: " + moment().format("MMMM Do YYYY, h:mm:ss a"));

function checkTimestampAndScrape() {
  console.log(
    "Ran Scrape at: " +
      moment().format("MMMM Do YYYY, h:mm:ss a") +
      ".  Next scrape in 6 hours."
  );

  axios.get("https://www.telus.com/en/digital/careers/").then((res) => {
    const sendMail = (jobData) => {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.PROJECT_EMAIL_ADDRESS,
          clientId: process.env.PROJECT_AUTH_CLIENT_ID,
          clientSecret: process.env.PROJECT_AUTH_SECRET_ID,
          refreshToken: process.env.PROJECT_AUTH_REFRESH,
          accessToken: process.env.PROJECT_AUTH_ACCESS_TOKEN,
        },
      });

      let mailOptions = {
        from: "chrisstanarsenault@gmail.com",
        to: "chrisstanarsenault@gmail.com",
        subject: "Telus Job Board Update!",
        text: "This just in from the Telus Career board!",
        html: jobData,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email.sent: " + info.response);
        }
      });
    };

    const tableData = [];

    const $ = cheerio.load(res.data);

    $("tr").each((index, element) => {
      if (
        // Job Title
        $(element).next().children().first().text().indexOf("Junior") != -1 &&
        // Job Location
        $(element).next().children().next().first().text() === "Toronto, ON" &&
        // Job Department
        $(element).next().children().next().next().first().text() ===
          "Development"
      ) {
        tableData.push({
          jobTitle: $(element).next().children().first().text(),
          jobTitleLink: $(element)
            .next()
            .first()
            .children()
            .children("a")
            .attr("href"),
          jobLocation: $(element).next().children().next().first().text(),
          jobDepartment: $(element)
            .next()
            .children()
            .next()
            .next()
            .first()
            .text(),
        });
      }
    });

    // new table row for each job found
    let jobs = tableData.map(
      (job) => `
      <tr>
        <td style="border: 1px solid black; padding: 15px"><a href="https://www.telus.com${job.jobTitleLink}">${job.jobTitle}</a></td>
        <td style="border: 1px solid black; padding: 15px">${job.jobLocation}</td>
        <td style="border: 1px solid black; padding: 15px">${job.jobDepartment}</td>
      </tr>
    `
    );

    // table to be sent in email
    let jobTable = `
      <table style='border: 1px solid black'>
        <tbody>
          <tr>
          <th style='border: 1px solid black; padding: 15px'>Role</th>
          <th style='border: 1px solid black; padding: 15px'>Location</th>
          <th style='border: 1px solid black; padding: 15px'>Department</th>
        </tr>
        ${jobs}
        </tbody>
      </table>`;

    // send email only if there is new junior positions found
    if (tableData.length > 0) {
      sendMail(jobTable);
    }
  });
}
