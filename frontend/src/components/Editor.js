import React, { useState, useEffect } from "react";
import useDebounce from "./Debounce";

// Flag Variables
let shouldUpdate = true;
let prevTime = 0;
let currentTime = 0;
let duration = 0;
const controller = new AbortController();
const { signal } = controller

let prevTime = 0;
let currentTime = 0;
let duration = 0;

const LOGGER = {
  key: [],
  userText: [],
  suggestionText: [],
  selectionStart: [],
  selectionEnd: [],
  acceptedSuggestion: [],
  duration: []
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

function logger(event, userText, suggestionText, acceptedSuggetion, duration) {
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
    if (debouncedQuery && shouldUpdate) {
      setIsQuerying(true);
      console.log("making api call")
      fetch("http://52.255.164.210:8080/phrase_complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          prompt: debouncedQuery,
          complete_type: "PhraseComplete",
          bias_id: 0 // 0 for positive, 1 for negative
        }),
        signal: signal
      })
        .then((response) => response.json())
        .then((response) => {
          updateSuggestionBuffer(response.phrase)
          console.log(response.phrase)
        }

        )
        .catch((error) => {
          console.error(error);
          return "";
        });
    } else {
      if (shouldUpdate) {
        updateSuggestionText(debouncedQuery);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    updateSuggestionText(userText + suggestionBuffer);
  }, [suggestionBuffer]);

  useEffect(() => {
    position = getXYCursor(userText, cursorPosition);
    suggestionBox = document.createElement("div");
    suggestionBox.id = "suggestionBox";
    suggestionBox.style.position = "absolute";
    suggestionBox.style.left = `${position.left + 2}px`;
    suggestionBox.style.top = `${position.top}px`;
    suggestionBox.textContent = suggestionText;
    suggestionBox.style.border = "thick solid #0000FF";
    document.body.appendChild(suggestionBox);
  }, [suggestionText]);

  const onChangeUserText = (event) => {
    updateUserText(event.target.value);
    if (document.contains(document.getElementById("suggestionBox"))) {
      document.getElementById("suggestionBox").remove();
    }
    cursorPosition = event.target.selectionEnd;
    // Also need to make sure that text is not cleared when user is typing the right thing
    if (
      suggestionText.charAt(userText.length) !=
      event.target.value[userText.length]
    ) {
      updateSuggestionText(event.target.value);
      shouldUpdate = true;
    } else {
      shouldUpdate = false;
    }
  };

  const onTab = (event) => {
    let acceptedSuggestion = '';
    if (event.key == "Tab") {
      event.preventDefault();
      const suggestion = suggestionText.replace(userText, "");
      if (userText != suggestionText) {
        if (suggestion[0] == " ") {
          acceptedSuggestion = " " + suggestion.trim().split(" ").shift()
          updateUserText(userText + " " + suggestion.trim().split(" ").shift());
        } else {
          acceptedSuggestion = suggestion.split(" ").shift()
          updateUserText(userText + suggestion.split(" ").shift());
        }
        shouldUpdate = false;
      }
    }
    currentTime = Date.now();
    duration = currentTime - prevTime
    prevTime = currentTime
    logger(event, userText, suggestionText, acceptedSuggestion, duration)
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
      })
      .catch((error) => {
        console.error(error);
        return "";
      });
  };

  const clearBoundingBox = (e) => {
    if (document.contains(document.getElementById("suggestionBox"))) {
      document.getElementById("suggestionBox").remove();
    }
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
      <textarea
        id="suggestionText"
        value={suggestionText}
        onChange={onChangeUserText}
      />
      <div id="boundingBoxCalculator" value={userText}></div>
      <button onClick={submit}>Submit</button>
    </div>
  );
}
