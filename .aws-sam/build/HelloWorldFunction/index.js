const Alexa = require('ask-sdk');


// 1. Launch Intent
//Can Handle : Is New Session || LaunchRequestType
//Handle : Check & set Attributes if any. Speak Launch Message and Reprompt for Yes or No?
// 2. YesIntent
// Can Handle : If an existing game or not playing but someone said Yes 
// Handle: Start the same , Generate guess number & ask user to guess a number also reprompt
// 3. NoIntent
// 
// 4. NumberGuessIntent   
//Can Handle : Game is started & some one said a number
//Handle : Get slot value. Say Good or bad & keep track of score & Ask for another question/guess. Continue till ended.
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to First Graders! Lets play a game. I will ask you 10 Simple Maths questions. To end the game anytime just say I am done. Do you want to play a game?';
    const promptText = 'Do you want to play a game?';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .getResponse();
  }
};



const YesIntent = {
  canHandle(handlerInput) {
    // only start a new game if yes is said when not playing a game.  
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.gameState = 'STARTED';

    sessionAttributes.totalQuestions = 0;
    sessionAttributes.totalCorrectAnswers = 0;
    //Commmon Logic between this and next intent
    const {higherNumber, lowerNumber, plusOrMinus} = gameLogic(sessionAttributes);
    // Common Logic ends

    return handlerInput.responseBuilder
      .speak(`Great! Here is your first question. What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
      .reprompt(`What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
      .getResponse();
  },
};

const NumberGuessIntent = {
  canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return isCurrentlyPlaying
      && Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NumberGuessIntent';
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const guessNum = parseInt(Alexa.getSlotValue(handlerInput.requestEnvelope, 'number'), 10);
    const correctAnswer = sessionAttributes.correctAnswer;
    // const slots = handlerInput.requestEnvelope.request.intent.slots;
    // const number = slots['numberAnswer'].value;      
    if (sessionAttributes.totalQuestions === 10) {
      if (sessionAttributes.totalCorrectAnswers >= 1) {
        resp = `Hooray! You got ${sessionAttributes.totalCorrectAnswers} out of ${sessionAttributes.totalQuestions} correct. Do try a game later sometime!`
      }
      else {
        resp = 'No Problem! Do try a game later sometime.'
      }
      return handlerInput.responseBuilder
        .speak(resp)
        .getResponse();
    } else if (guessNum != correctAnswer) {
        //Commmon Logic between this and next intent
        const {higherNumber, lowerNumber, plusOrMinus} = gameLogic(sessionAttributes);
        // Common Logic ends
      return handlerInput.responseBuilder
        .speak(`Oh Oh! The correct answer is ${correctAnswer}. Next question. What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
        .reprompt(`What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
        .getResponse();
    } else if (guessNum === correctAnswer) {
      sessionAttributes.totalCorrectAnswers = sessionAttributes.totalCorrectAnswers + 1;
          //Commmon Logic between this and next intent
          const {higherNumber, lowerNumber, plusOrMinus} = gameLogic(sessionAttributes);
          // Common Logic ends
      return handlerInput.responseBuilder
        .speak(`Thats Correct! Next question. What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
        .reprompt(`What is ${higherNumber} ${plusOrMinus} ${lowerNumber}`)
        .getResponse();
    }
    return handlerInput.responseBuilder
      .speak('Well I can not help with you that. Would you like to start a new game or Are you done? ')
      .reprompt('Would you like to start a new game or Are you done? ')
      .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.gameState = 'ENDED';
    let resp = '';
    // Tell him customized message. His score if more than 0 or 
    if (sessionAttributes.totalCorrectAnswers >= 1) {
      resp = `You got ${sessionAttributes.totalCorrectAnswers} out of ${sessionAttributes.totalQuestions} correct. Do try a game later sometime!`
    }
    else {
      resp = 'No Problem! Do try a game later sometime.'
    }

    return handlerInput.responseBuilder
      .speak(resp)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    // handle fallback intent, yes and no when playing a game
    // for yes and no, will only get here if and not caught by the normal intent handler
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent');
  },
  handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (sessionAttributes.gameState && sessionAttributes.gameState === 'STARTED') {
      sessionAttributes.totalQuestions = sessionAttributes.totalQuestions - 1;
      // currently playing
      return handlerInput.responseBuilder
        .speak(`Well I can not help you with that. Would you like a new game or Are you done?`)
        .reprompt('Would you like a new game or Are you done? ')
        .getResponse();
    }

    // not playing
    sessionAttributes.totalQuestions = 0;
    sessionAttributes.totalCorrectAnswers = 0;
    return handlerInput.responseBuilder
      .speak('Well I can not help with you that. Would you like a new game or Are you done? ')
      .reprompt('Would you like a new game or Are you done?')
      .getResponse();
  },
};


const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};


const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    return handlerInput.responseBuilder.getResponse();
  }
};
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  }
};
function gameLogic(sessionAttributes) {
  zeroOrOne = getNumberBetweenRange(0, 1);
  higherNumber = getNumberBetweenRange(1, 20);
  lowerNumber = getNumberBetweenRange(0, higherNumber);
  if (zeroOrOne === 0) {
    sessionAttributes.correctAnswer = higherNumber + lowerNumber;
    plusOrMinus = 'plus';
  }
  else {
    sessionAttributes.correctAnswer = higherNumber - lowerNumber;
    plusOrMinus = 'minus';
  }
  sessionAttributes.totalQuestions = sessionAttributes.totalQuestions + 1;
  return {higherNumber, lowerNumber, plusOrMinus}
}

function getNumberBetweenRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
// const favoriteColor = getSlotValue(handlerInput.requestEnvelope, 'favoriteColor')
//     sessionAttributes.favoriteColor = favoriteColor;
//handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

let skill;

exports.handler = async function (event, context) {
  console.log(`REQUEST++++${JSON.stringify(event)}`);
  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        NumberGuessIntent,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        YesIntent,
        NoIntent,
        FallbackHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);

  return response;
};