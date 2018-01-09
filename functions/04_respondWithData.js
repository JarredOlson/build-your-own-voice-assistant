var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const stream = require('stream');
var request = require('request');

function main(params) {

    return new Promise(function (resolve, reject) {
        getTranscriptFromAudio(params)
            .then(function (transcript) {
                doNaturalLanguageUnderstanding(params, transcript)
                    .then((location) => {
                        getWeatherData(params, location)
                            .then((weatherData) => {
                                var text_to_speech = new TextToSpeechV1({
                                    username: params.TEXT_TO_SPEECH_USERNAME,
                                    password: params.TEXT_TO_SPEECH_PASSWORD
                                });

                                const text = `The current forecast in ${location} is ${weatherData.weather[0].description}, with a high temperature of ${weatherData.main.temp_max} degrees`;
                                var textToSpeechParams = {
                                    text: text,
                                    voice: 'en-US_AllisonVoice',
                                    accept: 'audio/mp3'
                                };

                                //https://www.ibm.com/watson/developercloud/text-to-speech/api/v1/#synthesize_audio
                                text_to_speech.synthesize(textToSpeechParams, function (error, data) {
                                    if (error) {
                                        reject({error: error});
                                    }
                                    const base64EncodedAudio = data.toString('base64');
                                    const responseObject = {
                                        text: text,
                                        transcript: transcript,
                                        base64EncodedAudio: base64EncodedAudio,
                                    };
                                    resolve(responseObject);
                                });
                            })
                            .catch((error) => {
                                reject({error: error});
                            });
                    })
                    .catch((error) => {
                        reject({error: error});
                    });
            })
            .catch(function (error) {
                reject({error: error});
            });
    });
}

function getWeatherData(params, location) {
    return new Promise((resolve, reject) => {
        request.get(`http://api.openweathermap.org/data/2.5/weather?q=${location},us&units=imperial&appid=${params.WEATHER_APP_ID}`, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(data.body));
        });
    });
}

function doNaturalLanguageUnderstanding(params, transcript) {
    return new Promise(function (resolve, reject) {
        getTranscriptFromAudio(params)
            .then(function (transcript) {
                var naturalLanguageUnderstandingParams = {
                    'text': transcript,
                    'features': {
                        'keywords': {
                            'limit': 2
                        },
                        'entities': {
                            'limit': 2
                        }
                    }
                };
                var natural_language_understanding = new NaturalLanguageUnderstandingV1({
                    'username': params.NATURAL_LANGUAGE_UNDERSTANDING_USERNAME,
                    'password': params.NATURAL_LANGUAGE_UNDERSTANDING_PASSWORD,
                    'version_date': '2017-02-27'
                });
                // Call Natural Language Understanding
                // https://www.ibm.com/watson/developercloud/natural-language-understanding/api/v1/#post-analyze
                natural_language_understanding.analyze(naturalLanguageUnderstandingParams, function (err, response) {
                    if (err) {
                        reject({error: err});
                    } else {
                        // resolve(response);
                        const entity = response.entities[0];
                        if ("Location" == entity.type) {
                            resolve(entity.text);
                        } else {
                            reject("Could not determine location");
                        }
                    }
                });
            })
            .catch(function (error) {
                reject({error: error});
            });
    });
}


function getTranscriptFromAudio(params) {
    return new Promise(function (resolve, reject) {
        var speech_to_text = new SpeechToTextV1({
            username: params.SPEECH_TO_TEXT_USERNAME,
            password: params.SPEECH_TO_TEXT_PASSWORD
        });
        // Get audio file from request
        const data = params.__ow_body;

        // Create Stream from audio file
        var bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer(params.__ow_body, 'base64'));
        const audio = bufferStream;

        // Request parameters for Watson Speech to Text
        // https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/#recognize_sessionless_nonmp12
        var speechToTextParams = {
            audio: audio,
            content_type: 'audio/wav',
            timestamps: true
        };
        // Call Watson Speech to Text
        speech_to_text.recognize(speechToTextParams, function (error, response) {
            if (error) {
                reject({error: error});
            } else {
                // resolve(response);
                resolve(response.results[0].alternatives[0].transcript);
            }
        });
    });
}