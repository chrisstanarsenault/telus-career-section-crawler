require("dotenv").config();
const nodemailer = require("nodemailer");
const cheerio = require("cheerio");
const axios = require("axios");
const moment = require("moment");

setInterval(runScrape, 20000);

function runScrape() {
  console.log("Ran Scrape at: " + moment().format("MMMM Do YYYY, h:mm:ss"));

  axios.get("https://www.telus.com/en/digital/careers/").then((res) => {
    const sendMail = (jobData) => {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "chrisstanarsenault@gmail.com",
          pass: process.env.MY_EMAIL_PASSWORD,
        },
      });

      let mailOptions = {
        from: "Telus Board Scraper",
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
        $(element).next().children().first().text().indexOf("Junior") != -1 &&
        $(element).next().children().next().first().text() === "Toronto, ON" &&
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

    let jobs = tableData.map(
      (job) => `
      <tr>
        <td style="border: 1px solid black; padding: 15px"><a href="https://www.telus.com${job.jobTitleLink}">${job.jobTitle}</a></td>
        <td style="border: 1px solid black; padding: 15px">${job.jobLocation}</td>
        <td style="border: 1px solid black; padding: 15px">${job.jobDepartment}</td>
      </tr>
    `
    );

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

    if (tableData.length > 0) {
      sendMail(jobTable);
    }
  });
}
