var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
require('dotenv').config();
var app = express();

app.get('/scrape', function (req, res) {
  url = 'https://klocksnack.se/search/13228812/?q=556&t=post&o=date&c[title_only]=1&c[node]=11+50';

  request(url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var title, date;
      var watchArray = [];
      var dateArray = [];
      var json = { title: watchArray, date: dateArray };

      // https://stackoverflow.com/questions/47840449/parse-text-from-html-form-inside-table-cell-with-cheerio

      // Kolla vid 49:00 https://www.youtube.com/watch?v=6R7u6EMWaa4
      $('.titleText').filter(function () {
        var data = $(this);

        // Kolla vad log data / title är.
        // Testa att ändra json till title och date igen och sen pusha de till array.
        // Är de i fel ordning går det att göra reverse
        // Kanske skapa ett genensamt objekt för namn och datum?
        // Kanske skapa ett till objekt och köra en for loop där man lägger in varannat array index?
        title = data
          .children()
          .children()
          .text()
          .replace(/[^a-zA-ZäöåÄÖÅ0-9 ]/g, ' ') // Tar bort alla specialkaraktärer
          .replace(/(?!\b\s+\b)\s+/g, ''); // Tar bort mellanslag

        watchArray.push(title);
      });
    } else {
      console.log(error);
    }

    $('.DateTime').filter(function () {
      var data = $(this);

      date = data.text();

      dateArray.push(date);
    });

    var dateAndTime = new Date().toLocaleString();
    var text = `${watchArray[0]} ${dateArray[0]} skickat: ${dateAndTime} nodemon`;
    console.log(text);
    json.title = watchArray[0];
    json.date = dateArray[0];

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    let mailoptions = {
      from: 'ksappscraper@gmail.com',
      to: 'davidgust99@gmail.com',
      subject: 'KS test',
      text: text,
    };

    transporter.sendMail(mailoptions, function (err, data) {
      if (error) {
        console.log('error occured', err);
      } else {
        console.log('Email sent');
      }
    });

    // To write to the system we will use the built in 'fs' library.
    // In this example we will pass 3 parameters to the writeFile function
    // Parameter 1 :  output.json - this is what the created filename will be called
    // Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
    // Parameter 3 :  callback function - a callback function to let us know the status of our function

    fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
      console.log('File successfully written! - Check your project directory for the output.json file');
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send('Check your console!');
  });
});

app.listen('8081');
console.log(`Server runnig on: http://localhost:8081/scrape`);
exports = module.exports = app;
