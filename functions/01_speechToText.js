var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
const stream = require('stream');


function main(params) {

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
                resolve(response);
            }
        });
    });
}
