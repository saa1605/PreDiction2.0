import React, { useState, useEffect } from 'react';
import useDebounce from './Debounce';

export default function Editor() {

	const [userText, updateUserText] = useState('');
	const [suggestionText, updateSuggestionText] = useState('');
	const [isQuerying, setIsQuerying] = useState(false);
	const debouncedQuery = useDebounce(userText, 500);

	useEffect(() => {
		if (debouncedQuery) {
			setIsQuerying(true);
			fetch('http://localhost:8000/phrase_complete', {
				"method": "POST",
				"headers": {
					"content-type": "application/json",
					"accept": "application/json"
				},
				"body": JSON.stringify({
					"prompt": debouncedQuery,
					"complete_type": "PhraseComplete"
				})
			})
				.then(response => response.json())
				.then(response => updateSuggestionText(debouncedQuery + response.phrase))
				.catch(error => {
					console.error(error)
					return ''
				});
		} else {
			updateSuggestionText(debouncedQuery)
		}
	}, [debouncedQuery])

	const onChangeUserText = (event) => {
		updateUserText(event.target.value);
		updateSuggestionText(userText)
	};

	const onTab = (event) => {
		if (event.key == 'Tab') {
			event.preventDefault();
			console.log("TAB PRESSED")
			if (userText != suggestionText) {
				updateUserText(suggestionText)
			}
		}

	}

	return (
		<div>
			<textarea id="userText" value={userText} onChange={onChangeUserText} onKeyDown={onTab} />
			<textarea id="suggestionText" value={suggestionText} onChange={onChangeUserText} />
		</div>
	)
}