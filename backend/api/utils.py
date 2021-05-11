import re
import torch
import sys


def clean_html(raw_html):
    cleanr = re.compile('<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext


def clean_newlines(raw_text):
    return raw_text.replace('\n', '')


def process_phrase(phrase):
    # Replace full stops, commas, hyphens, slashes, inverted commas
    phrase = phrase.replace(" .", ".")
    phrase = phrase.replace(" ,", ",")
    phrase = phrase.replace(" /", "/")
    phrase = phrase.replace(" '", "'")
    phrase = phrase.replace(" - ", "-")
    phrase = phrase.replace(" n't", "n't")
    phrase = phrase.replace(" ?", "?")
    phrase = phrase.replace(" !", "!")
    phrase = phrase.replace("!", "")
    phrase = phrase.replace("?", "")
    phrase = clean_html(phrase)
    phrase = clean_newlines(phrase)
    return phrase


def complete_word_transformer(language_model, tokenizer, text, final_word):
    if len(text) == 0:
        return ''
    ids = tokenizer.encode(text)
    t = torch.LongTensor(ids)[None].to('cuda')
    logits = language_model.forward(t)[0][-1][-1]
    sorted_indices = torch.argsort(logits, descending=True)
    for tk_idx in sorted_indices:
        word = tokenizer.decode([tk_idx.cpu()]).strip()
        if word.lower().startswith(final_word):
            print(final_word, sys.stderr)
            if len(word.lower()) > len(final_word):
                return word[len(final_word):]
    return ""
