'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  {google} = require('googleapis'),
  customsearch = google.customsearch('v1'),
  app = express().use(bodyParser.json());



  app.get('/setup',function(req,res){

    setupGetStartedButton(res);
});


   // creates express http server
 //var app = express();
 //app.use(bodyParser.urlencoded({extended: false}));
 //app.use(bodyParser.json());

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
//let webhook_event = entry.messaging[0];
app.post("/webhook", function (req, res) {
  
  let body = req.body;
  // Make sure this is a page subscription
  if (body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
     body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      //console.log("GOT:" + webhook_event.message.text);  
       
       // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        } else if (event.message) {
          processReply(event);
        }
      });
    });

    res.sendStatus(200);
  }
});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "this_is_my_token"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === process.env.VERIFICATION_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function setupGetStartedButton(res){
        var messageData = {
                "get_started":[
                {
                    "payload":"Greeting"
                    }
                ]
        };

        // Start the request
        request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ process.env.PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                res.send(body);

            } else { 
                // TODO: Handle errors
       }
        });
    }

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (event.postback && event.postback.payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "My name is SP Movie Bot. I can tell you various details regarding movies. What movie would you like to know about?";
      sendMessage(senderId, {text: message});
    });
  }
}



function processReply(event) {
   if (!event.message.is_echo) {
    var message = event.message.text;
    var senderId = event.sender.id;
//  var payload = event.postback.payload;
     console.log("message recieved" + message);

  //if (message.text) {
    //  var formattedMsg = message.text.toLowerCase().trim();
    // Get user's first name from the User Profile API
    // and include it in the greeting

      async function runSample (options) {
   const res = await customsearch.cse.list({
    cx: options.cx,
    q: options.q,
    auth: options.apiKey,
    //cr: options.cr,
    gl: options.gl,
    //sort: options.sort,
    hl: options.hl,
    //searchType: options.searchType
    //excludeTerms: options.excludeTerms
    //siteSearch: options.siteSearch,
    //exactTerms: options.exactTerms, 
    //relatedSite: options.relatedSite  
   });

   console.log(options);
   sendMessage(senderId,{text: JSON.stringify(res.data.items[0].snippet)});
}
      
      
        if (module === require.main) {
    // You can get a custom search engine id at
   // https://www.google.com/cse/create/new
   const options = {
     q: message,
     apiKey: "AIzaSyCAHR97s2K0FraVXCcE1fRZ9YiAq_jbx-4",
     cx: "013805842144686568974:4kpub8audwm",
     gl:"Eg",
     //cr: "countryEG",
     hl: "lang_en",
     //searchType: "image"
     //excludeTerms: "google",
    //siteSearch: "https://met.guc.edu.eg",
    // exactTerms:`${text}`, 
     //relatedSite:"https://www.facebook.com/" ,
     //sort: "date"
   };
   runSample(options).catch(console.error);
          
 }

 module.exports = {
   runSample
 };
  
}
}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}





