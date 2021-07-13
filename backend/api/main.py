from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from nltk.tokenize import word_tokenize
from utils import clean_html, clean_newlines, process_phrase, complete_word_transformer, generate_text_transformer
import time
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from nltk.corpus import words as common_words
import string
import re
import datetime
import sys 

app = FastAPI()

tokenizer = AutoTokenizer.from_pretrained("gpt2")

positive_model = AutoModelForCausalLM.from_pretrained(
    "/home/advaitmb/notebooks/projects/PreDiction2.0/backend/models/gpt2-imdb-positive-sentiment")
negative_model = AutoModelForCausalLM.from_pretrained(
    "/home/advaitmb/notebooks/projects/PreDiction2.0/backend/models/gpt2-imdb-negative-sentiment")

positive_model.to('cuda')
negative_model.to('cuda')

origins = [
    '*'
    '*/*'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Query(BaseModel):
    prompt: str
    bias_id: int
    complete_type: str


class Log(BaseModel):
    log: str
    text: str


@app.get("/")
async def root():
    return {"Hello": "World"}


@app.post("/phrase_complete")
def phrase_complete(query: Query):
    query_text = query.prompt
    complete_type = query.complete_type
    bias_id = query.bias_id
    start_word_complete = time.time()
    # Consider last 25 words
    text = " ".join(query_text.split(" ")[-25:])
    # text = clean_newlines(text)
    # Tokenized Text will only be used for word completion but will not affect the actual text of phrase in any way
    tokenized_text = word_tokenize(text)
    word_complete = ''
    # Replace hyphens as they are not handled by word_tokenize
    text = text.replace("-", " - ")

    # Word Complete Section

    if text[-1] != " " and tokenized_text[-1] not in string.punctuation:
        if bias_id == 0:
            word_complete = complete_word_transformer(positive_model,
                                                      tokenizer, " ".join(tokenized_text[:-1]), tokenized_text[-1])
        else:
            word_complete = complete_word_transformer(negative_model,
                                                      tokenizer, " ".join(tokenized_text[:-1]), tokenized_text[-1])
        print(f'word_complete output: {word_complete}')
    word_completed_text = text + word_complete
    word_completed_text = word_completed_text.lstrip()
    end_word_complete = time.time()
    process_time_word_complete = end_word_complete - start_word_complete

    # Generate Phrase Section
    phrase = ""
    if bias_id == 0:
        phrase = generate_text_transformer(
            positive_model, tokenizer, word_completed_text, n_words_max=5, min_score=-2)
    else:

        phrase = generate_text_transformer(
            negative_model, tokenizer, word_completed_text, n_words_max=5, min_score=-2)
    process_time_phrase_complete = time.time() - end_word_complete

    # Special case to handle things like -> word1 word2 word3.word4 instead of word1 word2 word3. word4
    if text[-1] == " " and text[-2] in string.punctuation and phrase[len(text)-1] != " ":
        phrase = phrase[:len(text)-1] + " " + phrase[len(text)-1:]

    return_phrase = phrase[len(text):]

    # If something breaks comment this line and try again
    return_phrase = re.sub(r'\.(?! )', '. ', re.sub(r' +', ' ', return_phrase))

    return {"phrase": return_phrase,
            "word_complete": word_complete,
            "time_word_complete": process_time_word_complete,
            "time_phrase_complete": process_time_phrase_complete}


@ app.post("/submit")
def submit(log: Log):
    with open(f'logs/log{datetime.datetime.now()}.txt', 'w') as f:
        f.write(log.log)

    return {"Log Received"}
