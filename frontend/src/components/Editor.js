import React, { useState, useEffect } from "react";
import useDebounce from "./Debounce";

// Flag Variables
let shouldUpdate = true;

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

export default function Editor() {
  const [userText, updateUserText] = useState("");
  const [suggestionText, updateSuggestionText] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const debouncedQuery = useDebounce(userText, 300);

  useEffect(() => {
    // shouldUpdate reflects whether user is typing the same letters as displayed in suggestedText

    if (debouncedQuery && shouldUpdate) {
      setIsQuerying(true);
      fetch("http://0.0.0.0:8080/phrase_complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          prompt: debouncedQuery,
          complete_type: "PhraseComplete",
          bias_id: 0
        }),
      })
        .then((response) => response.json())
        .then((response) =>
          updateSuggestionText(debouncedQuery + response.phrase)
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
    console.log("This is in onChange", shouldUpdate);
  };

  const onTab = (event) => {
    if (event.key == "Tab") {
      event.preventDefault();
      const suggestion = suggestionText.replace(userText, "");
      console.log("suggestion", suggestion);
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
    </div>
  );
}
