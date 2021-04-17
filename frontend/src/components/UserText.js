import React, {useState} from 'react';


export default function UserText() {

	const [userText, updateUserText] = useState('');
	const [suggestionText, updateSuggestionText] = useState('');

	const onChangeUserText = (event) => {
		updateUserText(event.target.value);
		updateSuggestionText(event.target.value + 'abcd'); 
	};
	
	const onChangeSuggestionText = (event) => {
		updateSuggestionText(event.target.value);
	};
	let random_text = "abcdhs"
	return (
		<div>
			<textarea id="userText" value={userText} onChange={onChangeUserText}/>
			<textarea id="suggestionText" value={suggestionText} onChange={onChangeUserText}/>
		</div>
	)
}