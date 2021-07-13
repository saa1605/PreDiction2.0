import React, { useState, useEffect } from "react";
import useDebounce from "./Debounce";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
// Flag Variables
let shouldUpdate = true;
let prevTime = 0;
let currentTime = 0;
let duration = 0;
let CompletionFlag = false;
let isArc = false;
const controller = new AbortController();
const { signal } = controller
let suggestionBox;
let intermediateCursorPosition;
const LOGGER = {
  key: [],
  userText: [],
  suggestionText: [],
  selectionStart: [],
  selectionEnd: [],
  acceptedSuggestion: [],
  duration: [],
  isArc: []
}

function acceptOneToken(userText, suggestionText) {
  const userTextArray = userText.split(" ");
  const suggestionTextArray = suggestionText.split(" ");

  if (userTextArray.length === suggestionTextArray.length) {
    userText += suggestionTextArray[suggestionTextArray.length - 1];
  } else {
    userText += suggestionTextArray[userText.length];
  }

  return userText;
}

function hideSuggestion(){
  document.getElementById("suggestionBox").style.display="none"; 
}

function logger(event, userText, suggestionText, acceptedSuggetion, duration, isArc) {
  // Save the key
  LOGGER.key.push(event.nativeEvent.keyCode);
  // Save the text
  LOGGER.userText.push(userText);
  // Save the suggestion
  LOGGER.suggestionText.push(suggestionText);
  // Save the cursor
  LOGGER.selectionStart.push(event.target.selectionStart)
  LOGGER.selectionEnd.push(event.target.selectionEnd)
  LOGGER.acceptedSuggestion.push(acceptedSuggetion)
  LOGGER.duration.push(duration)
  LOGGER.isArc.push(isArc)
}
// function getXYCursor(text, selectionPoint) {
//   const div = document.createElement("div");
//   div.id = "boundingBoxCalculator";
//   div.textContent = text.substr(0, selectionPoint);
//   div.style.height = "auto";
//   const span = document.createElement("span");
//   span.textContent = text.substr(selectionPoint) || ".";
//   div.appendChild(span);
//   document.body.appendChild(div);
//   const spanLeft = span.offsetLeft;
//   const spanTop = span.offsetTop;
//   const divLeft = div.offsetLeft;
//   const divTop = div.offsetTop;
//   document.body.removeChild(div);
//   return {
//     left: divLeft + spanLeft,
//     top: divTop + spanTop,
//   };
// }
const getCursorXY = (input, selectionPoint) => {
  const {
    offsetLeft: inputX,
    offsetTop: inputY,
  } = input
  // create a dummy element that will be a clone of our input
  const div = document.createElement('div')
  // get the computed style of the input and clone it onto the dummy element
  const copyStyle = getComputedStyle(input)
  for (const prop of copyStyle) {
    div.style[prop] = copyStyle[prop]
  }
  // we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
  const swap = '.'
  const inputValue = input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value
  // set the div content to that of the textarea up until selection
  const textContent = inputValue.substr(0, selectionPoint)
  // set the text content of the dummy element div
  div.textContent = textContent
  if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
  // if a single line input then the div needs to be single line and not break out like a text area
  if (input.tagName === 'INPUT') div.style.width = 'auto'
  // create a marker element to obtain caret position
  const span = document.createElement('span')
  // give the span the textContent of remaining content so that the recreated dummy element is as close as possible
  span.textContent = inputValue.substr(selectionPoint) || '.'
  // append the span marker to the div
  div.appendChild(span)
  // append the dummy element to the body
  document.body.appendChild(div)
  // get the marker position, this is the caret position top and left relative to the input
  const { offsetLeft: spanX, offsetTop: spanY } = span
  // lastly, remove that dummy element
  // NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
  document.body.removeChild(div)
  // return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
  return {
    x: inputX + spanX,
    y: inputY + spanY,
  }
}

function updateBoundingBox(suggestionText){
  let X_OFFSET = 1;
  let Y_OFFSET = 4;
  const cursorPosition = document.getElementById('userText').selectionEnd
  console.log('cursorPosition: ', cursorPosition)
  const textArea = document.getElementById('userText')
  let position = getCursorXY(textArea, cursorPosition);
  console.log("info: ", cursorPosition, textArea.textContent.length)
  if (cursorPosition < textArea.textContent.trim().length){
    Y_OFFSET = -10;
  }
  let suggestionBox = document.getElementById("suggestionBox");
  suggestionBox.style.position = "absolute";
  suggestionBox.style.left = `${position.x+ X_OFFSET}px`;
  suggestionBox.style.top = `${position.y + Y_OFFSET}px`;
  suggestionBox.style.whiteSpace = 'pre'
  suggestionBox.textContent = suggestionText;
  suggestionBox.style.display = "block"
  console.log(suggestionBox.textContent)
}

export default function Editor() {
  const [userText, updateUserText] = useState("");
  const [suggestionText, updateSuggestionText] = useState("");
  const [suggestionBuffer, updateSuggestionBuffer] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const debouncedQuery = useDebounce(userText, 400);
  
  
  useEffect(() => {
    // shouldUpdate reflects whether user is typing the same letters as displayed in suggestedText
    // updateSuggestionBuffer('');
    console.log("here")
    if (debouncedQuery && shouldUpdate) {
      setIsQuerying(true);
      console.log("making api call")
      fetch("http://0.0.0.0:8080/phrase_complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          prompt: debouncedQuery.slice(0, document.getElementById('userText').selectionEnd),
          complete_type: "PhraseComplete",
          bias_id: 0 // 0 for positive, 1 for negative
        }),
        signal: signal
      })
        .then((response) => response.json())
        .then((response) => {
          updateSuggestionText(response.phrase)
          console.log(response.phrase)
        }

        )
        .catch((error) => {
          console.error(error);
          return "";
        });
    } else {
      if (shouldUpdate) {
        updateSuggestionText("");
      }
    }
  }, [debouncedQuery]);

  // useEffect(() => {
  //   updateSuggestionText(userText + suggestionBuffer);
  // }, [suggestionBuffer]);

  useEffect(() => {
   updateBoundingBox(suggestionText);
  }, [suggestionText]);


  useEffect(() => {
    if(CompletionFlag){
      document.getElementById('userText').selectionEnd = intermediateCursorPosition
      CompletionFlag = false;
      updateBoundingBox(suggestionText);
    }
  }, [userText])

  const onChangeUserText = (event) => {

    // Update value inside user text
    updateUserText(event.target.value);

    // Also need to make sure that text is not cleared when user is typing the right thing
    if (
      suggestionText[0]!=
      event.target.value[userText.length]
    ) {
      updateSuggestionText("");
      // Hide any suggestionbox when user starts typing new 
      hideSuggestion();
      shouldUpdate = true;
    } else {
      
      updateSuggestionText(suggestionText.slice(1,suggestionText.length));
      updateBoundingBox(suggestionText.slice(1,suggestionText.length)); 
      shouldUpdate = false;
    }
    
  };

  const onTab = (event) => {
    // let acceptedSuggestion = '';
    // if (event.key == "Tab") {
    //   event.preventDefault();
    //   const suggestion = suggestionText.replace(userText, "");
    //   if (userText != suggestionText) {
    //     if (suggestion[0] == " ") {
    //       acceptedSuggestion = " " + suggestion.trim().split(" ").shift()
    //       updateUserText(userText + " " + suggestion.trim().split(" ").shift());
    //     } else {
    //       acceptedSuggestion = suggestion.split(" ").shift()
    //       updateUserText(userText + suggestion.split(" ").shift());
    //     }
    //     shouldUpdate = false;
    //   }
    // }
    let acceptedSuggestion = '';
    if (event.key == "Tab") {
      CompletionFlag = true;
      event.preventDefault();
      // const suggestion = suggestionText.replace(userText, "");
      if (userText != suggestionText) {
        if (suggestionText[0] == " ") {
          acceptedSuggestion = " " + suggestionText.trim().split(" ").shift()
          if(suggestionText.trim().split(" ").length == 1){
            updateUserText(userText.slice(0, document.getElementById('userText').selectionEnd) + acceptedSuggestion + " " + userText.slice(document.getElementById('userText').selectionEnd), document.getElementById('userText').textContent);
          } else {
           updateUserText(userText.slice(0, document.getElementById('userText').selectionEnd) + acceptedSuggestion + userText.slice(document.getElementById('userText').selectionEnd), document.getElementById('userText').textContent); 
          }
          intermediateCursorPosition = document.getElementById('userText').selectionEnd + acceptedSuggestion.length
          
          
        } else {
          acceptedSuggestion = suggestionText.split(" ").shift()
          if(suggestionText.trim().split(" ").length == 1){
           updateUserText(userText.slice(0, document.getElementById('userText').selectionEnd) + acceptedSuggestion + " " + userText.slice(document.getElementById('userText').selectionEnd), document.getElementById('userText').textContent);
          } else {
           updateUserText(userText.slice(0, document.getElementById('userText').selectionEnd) + acceptedSuggestion + userText.slice(document.getElementById('userText').selectionEnd), document.getElementById('userText').textContent); 
          }
          intermediateCursorPosition = document.getElementById('userText').selectionEnd + acceptedSuggestion.length
          
        }

        updateSuggestionText(suggestionText.replace(acceptedSuggestion, ""))
        updateBoundingBox(suggestionText);
        shouldUpdate = false;
      }
    }
    currentTime = Date.now();
    duration = currentTime - prevTime
    prevTime = currentTime
    if (document.getElementById('userText').selectionEnd < document.getElementById('userText').textContent.trim().length){
      isArc = true;
    } else {
      isArc = false;
    }
    logger(event, userText, suggestionText, acceptedSuggestion, duration, isArc)
  };
  const submit = () => {
    LOGGER.userText.push(userText)
    LOGGER.suggestionText.push(suggestionText)
    duration = Date.now() - prevTime
    LOGGER.duration.push(duration)
    fetch("http://52.255.164.210:8080/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        log: JSON.stringify(LOGGER),
        text: userText,
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        window.location.href="/thankyou"
      })
      .catch((error) => {
        console.error(error);
        return "";
      });
  };

  const clearBoundingBox = (e) => {
    document.getElementById("suggestionBox").style.display="none";
  };

  return (
    <div>
      <textarea
        id="userText"
        value={userText}
        onChange={onChangeUserText}
        onKeyDown={onTab}
        onClick={clearBoundingBox}
      />
      <div id="boundingBoxCalculator" value={userText}></div>
      <div id="suggestionBox" value={suggestionText}></div>      
      <button className="submitButton" onClick={submit}>Click me</button>
    </div>
  );
}
