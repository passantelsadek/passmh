'use strict';

// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  //weather = require('weather-js'),
  {google} = require('googleapis'),
  apiaiApp = require('apiai')('b1e2a7640fb440529780b84b1851a1f4'),
  nutrition = require("nutrition"),
  customsearch = google.customsearch('v1'),
  app = express().use(bodyParser.json());

var delay = ( function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 

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
        processReply(event);
      });
    });

    res.sendStatus(200);
  }
});

          app.post('/ai', (req, res) => {
  console.log('*** Webhook for api.ai query ***');
  console.log(req.body.result);

  if (req.body.result.action === 'weather') {
    console.log('** weather **');
    let city = req.body.result.parameters['geo-city'];
    let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID=c355d6fe8ab3abe2d69f499a6f5147f4&q=' +city;
    //console.log("the url is:" + restUrl)

    request.get(restUrl, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        let json = JSON.parse(body);
        console.log(json);
        let tempF = ~~(json.main.temp * 9/5 - 459.67);
        let tempC = ~~(json.main.temp - 273.15);
        let msg = "The current condition in " + json.name + " is " + json.weather[0].description + " and the temperature is " + tempF + " ℉ (" +tempC+ " ℃)."
        return res.json({
          speech: msg,
          displayText: msg,
          source: 'weather'
        });
        
      } else {
        let errorMessage = 'I failed to look up the city name.';
        return res.status(400).json({
          status: {
            code: 400,
            errorType: errorMessage
          }
        });
      }
    })
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




function processHi(event) {
  var senderId = event.sender.id;
  //var payload = event.postback.payload;

  //if (payload === "Greeting") {
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
        var name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + "My name is TestBot. I can tell you various info and facts. Love me today and lets get this started :D";
      sendTextMessage(senderId,message);
         
    });
  }



function processReply(event) {
   if (!event.message.is_echo) {
    var message = event.message.text;
    var senderId = event.sender.id;
//  var payload = event.postback.payload;
     console.log("message recieved" + message);

  if (message === "Hi") {
    //  var formattedMsg = message.text.toLowerCase().trim();
    // Get user's first name from the User Profile API
    // and include it in the greeting

      async function runSample (options) {
   const res = await customsearch.cse.list({
    cx: options.cx,
    q: options.q,
    auth: options.apiKey,
    //cr: options.cr,
   // gl: options.gl,
    //sort: options.sort,
    //hl: options.hl,
    //searchType: options.searchType
    //excludeTerms: options.excludeTerms
    //siteSearch: options.siteSearch,
    //exactTerms: options.exactTerms, 
    //relatedSite: options.relatedSite  
   });

   console.log(options);
        
       sendTextMessage(senderId, JSON.stringify(res.data.items[0].snippet));
   
   }
      
        if (module === require.main) {
    // You can get a custom search engine id at
   // https://www.google.com/cse/create/new
   const options = {
     q: message,
     apiKey: "AIzaSyCAHR97s2K0FraVXCcE1fRZ9YiAq_jbx-4",
     cx: "013805842144686568974:4kpub8audwm",
    // gl:"Eg",
     //cr: "countryEG",
     //hl: "lang_en",
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
 }
 } 
  
}else{  
  console.log("ANA HENA");
 let apiai = apiaiApp.textRequest(message, {
    sessionId: 'tabby_cat' // use any arbitrary id
  });

  apiai.on('response', (response) => {
    // Got a response from api.ai. Let's POST to Facebook Messenger
    let aiText = response.result.fulfillment.speech;
    
     request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: senderId},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
 });
  

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();


}
    
}
}

function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPER_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var parameters = {
  'text': '' + messageText,
  'features': {
    'entities': {
      'emotion': true,
      'sentiment': true,
      'limit': 2
    },
    'keywords': {
      'emotion': true,
      'sentiment': true,
      'limit': 2
    }
  }
}

    //var sentmessage = JSON.stringify(response);
    //console.log(JSON.stringify(response, null, 2));
     var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
  }


   function sendQuickReply1(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Get to know about..",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Countries",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Nutrition",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Others",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  }
  
  if(messageData.message.quick_replies.title == "yes"){
     sendTextMessage(recipientId,"send places API");
     }

  callSendAPI(messageData);
};



  function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Do you want to check the..",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Weather",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Hotels",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Nothing",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  }
  
  if(messageData.message.quick_replies.title == "yes"){
     sendTextMessage(recipientId,"send places API");
     }

  callSendAPI(messageData);
};


  function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s",
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

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

function reply(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'tabby_cat' // use any arbitrary id
  });

  apiai.on('response', (response) => {
    // Got a response from api.ai. Let's POST to Facebook Messenger
    let aiText = response.result.fulfillment.speech;
    
     request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
 });
  

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}
           



// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.

module.exports = app;
  
  





