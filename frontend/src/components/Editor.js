import React, { useState, useEffect } from "react";
import useDebounce from "./Debounce";

// Flag Variables
let shouldUpdate = true;

const controller = new AbortController();
const { signal } = controller;

const LOGGER = {
  key: [],
  userText: [],
  suggestionText: [],
  selectionStart: [],
  selectionEnd: [],
};

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

function logger(event, userText, suggestionText) {
  // Save the key
  LOGGER.key.push(event.target.keycode);
  // Save the text
  LOGGER.userText.push(userText);
  // Save the suggestion
  LOGGER.suggestionText.push(suggestionText);
  // Save the cursor
  LOGGER.selectionStart.push(event.target.selectionStart);
  LOGGER.selectionEnd.push(event.target.selectionEnd);
}

export default function Editor() {
  const [userText, updateUserText] = useState("");
  const [suggestionText, updateSuggestionText] = useState("");
  const [suggestionBuffer, updateSuggestionBuffer] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const debouncedQuery = useDebounce(userText, 400);

  useEffect(() => {
    // shouldUpdate reflects whether user is typing the same letters as displayed in suggestedText
    if (debouncedQuery && shouldUpdate) {
      setIsQuerying(true);
      console.log("making api call");

      fetch("http://localhost:8000/phrase_complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          prompt: debouncedQuery.trim(),
          complete_type: "PhraseComplete",
          bias_id: 0,
        }),
        signal: signal,
      })
        .then((response) => response.json())
        .then((response) => {
          //          updateSuggestionBuffer(response.phrase);
          updateSuggestionText(userText + response.phrase);
        })
        .catch((error) => {
          console.error(error);
          return "";
        });
    } else {
      if (shouldUpdate) {
        //        updateSuggestionBuffer(debouncedQuery);
        updateSuggestionText(debouncedQuery);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    updateSuggestionText(userText + suggestionBuffer);
  }, [suggestionBuffer]);

  const onChangeUserText = (event) => {
    updateUserText(event.target.value);

    // Also need to make sure that text is not cleared when user is typing the right thing
    if (
      suggestionText.charAt(userText.length) !=
      event.target.value[userText.length]
    ) {
      updateSuggestionText(userText);
      shouldUpdate = true;
    } else {
      shouldUpdate = false;
    }

    // Logger
    logger(event, userText, suggestionText);
  };

  const onTab = (event) => {
    if (event.key == "Tab") {
      event.preventDefault();
      const suggestion = suggestionText.replace(userText, "");
      if (userText != suggestionText) {
        if (suggestion[0] == " ") {
          updateUserText(userText + " " + suggestion.trim().split(" ").shift());
        } else {
          updateUserText(userText + suggestion.split(" ").shift());
        }
        shouldUpdate = false;
      }
    }
  };

  const submit = () => {
    fetch("http://0.0.0.0:8080/submit", {
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

  return (
    <div>
      <textarea
        id="userText"
        value={userText}
        onChange={onChangeUserText}
        onKeyDown={onTab}
      />
      <textarea
        id="suggestionText"
        value={suggestionText}
        onChange={onChangeUserText}
      />
      <button onClick={submit}>Submit</button>
    </div>
  );
}
