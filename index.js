var pubnub;

const get_answers_url = 'https://pubsub.pubnub.com/v1/blocks/sub-key/sub-c-6a727412-91c6-11e8-b36b-922642fc525d/getAnswers';

const subscribe_key = "sub-c-6a727412-91c6-11e8-b36b-922642fc525d";

const publish_key = "pub-c-e8c60862-b990-42c1-add2-49acc66f1b4c";

const secret_key = "sec-c-MjQ1YjQ3YjAtNjE0NC00MmZlLTliY2EtZGRkOTVkNGZmNmQy";

var jsonReqOptions = {
    "body": {
        "which": "A"
    }
};

/*
*  This function is called when the Admin user presses the submit button.
*/
function publishQuestionAnswer() {
    pubnub = new PubNub({
        subscribeKey: subscribe_key,
        publishKey: publish_key,
        secretKey: secret_key,
        ssl: true
    });

    pubnub.publish({
            message: {
                "question": document.getElementById('question').value,
                "optionA": document.getElementById('optionA').value,
                "optionB": document.getElementById('optionB').value,
                "optionC": document.getElementById('optionC').value,
                "optionD": document.getElementById('optionD').value
            },
            channel: 'question_post',
            sendByPost: false, // true to send via post
            storeInHistory: false //override default storage options
        },
        function(status, response) {
            if (status.error) {
                // handle error
                console.log(status);
            } else {
                console.log("message Published w/ timetoken", response.timetoken);
            }
        });

    // Waits for 12 seconds then publishes correct answer and answer results.
    // Want to consider up to 2 second latency between answers being sent in and results being published.
    setTimeout(getResults, 12000);
}

/*
* This function gets the correct answer from the admin's entry. It then makes chained promisified XMLHttpRequests
* to the getAnswers PubNub function with the route specified as 'getcount' in order to obtain the count of how many people
* answered each option. Then publishes this data and resets the counters.
*/
function getResults() {
    var correctAnswer;
    if (document.getElementById('a_correct').checked) {
        correctAnswer = "optionA";
    } else if (document.getElementById('b_correct').checked) {
        correctAnswer = "optionB";
    } else if (document.getElementById('c_correct').checked) {
        correctAnswer = "optionC";
    } else if (document.getElementById('d_correct').checked) {
        correctAnswer = "optionD";
    }

    jsonReqOptions.body.which = "A";
    return request(get_answers_url + '?route=getcount', 'POST', jsonReqOptions).then((firstResponse) => {
        var countA = firstResponse.optionA;
        jsonReqOptions.body.which = "B";
        return request(get_answers_url + '?route=getcount', 'POST', jsonReqOptions).then((secondResponse) => {
            var countB = secondResponse.optionB;
            jsonReqOptions.body.which = "C";
            return request(get_answers_url + '?route=getcount', 'POST', jsonReqOptions).then((thirdResponse) => {
                var countC = thirdResponse.optionC;
                jsonReqOptions.body.which = "D";
                return request(get_answers_url + '?route=getcount', 'POST', jsonReqOptions).then((fourthResponse) => {
                    var countD = fourthResponse.optionD;
                    publishAnswerResults(countA, countB, countC, countD, correctAnswer);
                    // Waits a second then reset counters
                    setTimeout(resetCounters, 1000);
                })
            })
        })
    }).catch((error) => {
        console.log(error);
    });
}

/**
* This function is called by getResults() to publish the answer results onto the answer_post channel for users
* to see the correct answer and the stats of how many people answered which option.
* @param {Integer} countA number of users that answered optionA
* @param {Integer} countB number of users that answered optionB
* @param {Integer} countC number of users that answered optionC
* @param {Integer} countD number of users that answered optionD
* @param {String} correctAnswer either 'optionA', 'optionB', 'optionC', or 'optionD'
*/
function publishAnswerResults(countA, countB, countC, countD, correctAnswer) {
    pubnub.publish({
            message: {
                "optionA": countA,
                "optionB": countB,
                "optionC": countC,
                "optionD": countD,
                "correct": correctAnswer
            },
            channel: 'answer_post',
            sendByPost: false, // true to send via post
            storeInHistory: false //override default storage options
        },
        function(status, response) {
            if (status.error) {
                // handle error
                console.log(status);
            } else {
                console.log("message Published w/ timetoken", response.timetoken);
            }
        });
}

/*
* This function is called by getResults() to reset all our counters in the KV Store.
* This is done by calling our getAnswers PubNub function, which is modeled as a Rest API.
* We will specify the route as 'reset', so the appropriate function is executed.
*/
function resetCounters() {
    jsonReqOptions.body.which = "A";
    return request(get_answers_url + '?route=reset', 'POST', jsonReqOptions).then((firstResponse) => {
      jsonReqOptions.body.which = "B";
        return request(get_answers_url + '?route=reset', 'POST', jsonReqOptions).then((secondResponse) => {
          jsonReqOptions.body.which = "C";
            return request(get_answers_url + '?route=reset', 'POST', jsonReqOptions).then((thirdResponse) => {
              jsonReqOptions.body.which = "D";
                return request(get_answers_url + '?route=reset', 'POST', jsonReqOptions).then((fourthResponse) => {
                    console.log('Reset all counters!');
                })
            })
        })
    }).catch((error) => {
        console.log(error);
    });
}

function showQuestions()
{
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function populateQuestionOne()
{
    document.getElementById('question').value = "Which state has the southernmost place in the U.S?";
    document.getElementById('optionA').value = "Hawaii";
    document.getElementById('optionB').value = "Texas";
    document.getElementById('optionC').value = "California";
    document.getElementById('optionD').value = "Florida";
    document.getElementById('a_correct').checked = true;
}

function populateQuestionTwo()
{
  document.getElementById('question').value = "Which is the largest freshwater lake in the world?";
  document.getElementById('optionA').value = "Crater Lake";
  document.getElementById('optionB').value = "Lake Huron";
  document.getElementById('optionC').value = "Lake Superior";
  document.getElementById('optionD').value = "Lake Victoria";
  document.getElementById('c_correct').checked = true;
}

function populateQuestionThree()
{
  document.getElementById('question').value = "Which U.S. president is on the $100 bill?";
  document.getElementById('optionA').value = "Abraham Lincoln ";
  document.getElementById('optionB').value = "Andrew Jackson";
  document.getElementById('optionC').value = "John Adams";
  document.getElementById('optionD').value = "Benjamin Franklin";
  document.getElementById('d_correct').checked = true;
}

function populateQuestionFour()
{
  document.getElementById('question').value = "What company's the world's biggest distributer of toys?";
  document.getElementById('optionA').value = "McDonalds";
  document.getElementById('optionB').value = "Hasbro";
  document.getElementById('optionC').value = "Lego";
  document.getElementById('optionD').value = "Nerf";
  document.getElementById('a_correct').checked = true;
}

function populateQuestionFive()
{
  document.getElementById('question').value = "Spinach is high in which mineral?";
  document.getElementById('optionA').value = "Magnesium";
  document.getElementById('optionB').value = "Iron";
  document.getElementById('optionC').value = "Calcium";
  document.getElementById('optionD').value = "Potassium";
  document.getElementById('b_correct').checked = true;
}

/**
 * Helper function to make an HTTP request wrapped in an ES6 Promise.
 *
 * @param {String} url URL of the resource that is being requested.
 * @param {String} method POST, GET, PUT, etc.
 * @param {Object} options JSON Object with HTTP request options, "header"
 *     Object of possible headers to set, and a body Object of a request body.
 *
 * @return {Promise} Resolves a parsed JSON Object or String response text if
 *     the response code is in the 200 range. Rejects with response status text
 *     when the response code is outside of the 200 range.
 */
function request(url, method, options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let contentTypeIsSet = false;
        options = options || {};
        xhr.open(method, url);
        for (let header in options.headers) {
            if ({}.hasOwnProperty.call(options.headers, header)) {
                header = header.toLowerCase();
                contentTypeIsSet = header === 'content-type' ? true : contentTypeIsSet;
                xhr.setRequestHeader(header, options.headers[header]);
            }
        }
        if (!contentTypeIsSet) {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                let response;
                try {
                    response = JSON.parse(xhr.response);
                } catch (e) {
                    response = xhr.response;
                }
                resolve(response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            }
        };
        xhr.send(JSON.stringify(options.body));
    });
}
