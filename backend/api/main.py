from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from nltk.tokenize import word_tokenize
from utils import clean_html, clean_newlines, process_phrase, complete_word_transformer
import time
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from nltk.corpus import words as common_words

app = FastAPI()

tokenizer = AutoTokenizer.from_pretrained("gpt2")
positive_model = AutoModelForCausalLM.from_pretrained(
    "/home/advaitmb/notebooks/projects/PreDiction2.0/backend/models/gpt2-imdb-positive-sentiment")
negative_model = AutoModelForCausalLM.from_pretrained(
    "/home/advaitmb/notebooks/projects/PreDiction2.0/backend/models/gpt2-imdb-negative-sentiment")

positive_model.to('cuda')
negative_model.to('cuda')

positive_pipeline = pipeline(
    "text-generation", model=positive_model, tokenizer=tokenizer, device=0)
negative_pipeline = pipeline(
    "text-generation", model=negative_model, tokenizer=tokenizer, device=0)

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


@app.get("/")
async def root():
    return {"Hello": "World"}


@app.post("/phrase_complete")
def phrase_complete(query: Query):
    query_text = query.prompt
    complete_type = query.complete_type
    bias_id = query.bias_id
    start = time.time()
    # Consider last 25 words
    text = " ".join(query_text.split(" ")[-25:])
    tokenized_text = word_tokenize(text)
    word_complete = ''
    # Replace hyphens as they are not handled by word_tokenize
    text = text.replace("-", " - ")

    # Word Complete Section

    if tokenized_text[-1] not in common_words.words():
        if bias_id == 0:
            word_complete = complete_word_transformer(positive_model,
                                                      tokenizer, text, tokenized_text[-1])
        else:
            word_complete = complete_word_transformer(negative_model,
                                                      tokenizer, text, tokenized_text[-1])
    word_completed_text = text + word_complete
    # Generate Phrase completion using transformer pipeline
    phrase = ""
    if bias_id == 0:
        phrase = positive_pipeline(text_inputs=word_completed_text, seed=7,  num_beams=2, temperature=1.2,  max_length=(len(
            text.split(' ')) + 7), skip_special_tokens=True,
            do_sample=True, repetition_penalty=1.2)[0]["generated_text"]
    else:
        phrase = negative_pipeline(text_inputs=word_completed_text, seed=7,  num_beams=2, temperature=1.2,  max_length=(len(
            text.split(' ')) + 7), skip_special_tokens=True,
            do_sample=True, repetition_penalty=1.2)[0]["generated_text"]
    process_time = time.time() - start
    return {"phrase": phrase.replace(text, ''),
            "time": process_time}
