const Alexa = require('ask-sdk');
var randomWords = require('random-words');



// Maths Round off to nearest 10 . Fraction 1/2 is greater than 1/3 . True?
//English ...1. Opposites/Antonyms 2. How many vowels/syllables 3.  also synonym
//Fun stuff 1. Time :  Big hand is on the 12.Little hand is on the 7. 2. Planet 3. Animal Kids name

// How many planets are part of our solar system?
// What is the Sun?
// How long does it take the moon to revolve around Earth?
// When the light on the moon is getting bigger and brighter we say it is:
// Henry was asked about the differences between the day and night sky. What is something we would see easier at night than in the day time?
// What object in space do all of the planets orbit around?
//  What is this group of stars called?
// What is a scientist called who studies space in space?
// How long does it take the Earth to rotate once?

// Plants 
// Plants and animals need a lot of common things in order to survive. What type of air do plants need that animals do not?
// Which of the following items is not a living thing?
// How does a plant get its energy to grow?
// Which of the following do plants and animals not need to survive?
//  help the environmen
// Are you a living thing? are you alive?
// What do you drink?

// A bird can fly.
// What do you need to be alive?
//randomWords({exactly: 1, maxLength: 5})

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
    sessionAttributes.mathGameState = 'STARTED';

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
    let isCurrentlyPlayingMath = false;
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.mathGameState &&
      sessionAttributes.mathGameState === 'STARTED') {
      isCurrentlyPlayingMath = true;
    }

    return isCurrentlyPlayingMath
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

    sessionAttributes.mathGameState = 'ENDED';
    let resp = '';
    // Tell him customized message. His score if more than 0 or 
    if (sessionAttributes.totalCorrectAnswers >= 1) {
      resp = `You got ${sessionAttributes.totalCorrectAnswers} out of ${sessionAttributes.totalQuestions} correct.Goodbye!`
    }
    else {
      resp = 'No Problem! Goodbye!'
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
    if (sessionAttributes.mathGameState && sessionAttributes.mathGameState === 'STARTED') {
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
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.mathGameState = 'ENDED';
    let resp = '';
    // Tell him customized message. His score if more than 0 or 
    if (sessionAttributes.totalCorrectAnswers >= 1) {
      resp = `You got ${sessionAttributes.totalCorrectAnswers} out of ${sessionAttributes.totalQuestions} correct. Goodbye!`
    }
    else {
      resp = 'No Problem! Do try a game later sometime. Goodbye!'
    }

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