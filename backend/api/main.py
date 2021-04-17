from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from nltk.tokenize import word_tokenize
from utils import clean_html, clean_newlines, process_phrase
import time

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
    "text-generation", model=negative_model, tokenizer=tokenizer, device=-1)


@app.get("/")
async def root():
    return {"Hello": "World"}


@app.get("/phrase_complete/{bias_id}")
def phrase_complete(prompt: str, bias_id: int):
    query_text = prompt
    start = time.time()
    # Consider last 25 words
    text = " ".join(query_text.split(" ")[-25:])
    tokenized_text = word_tokenize(text)

    # Replace hyphens as they are not handled by word_tokenize
    text = text.replace("-", " - ")

    # Generate Phrase completion using transformer pipeline
    phrase = ""
    if bias_id == 0:
        phrase = positive_pipeline(text_inputs=text, seed=7,  num_beams=5, temperature=1.2,  max_length=(len(
            text.split(' ')) + 10), skip_special_tokens=True,
            do_sample=True, repetition_penalty=1.2)[0]["generated_text"]
    else:
        phrase = negative_pipeline(text_inputs=text, seed=7,  num_beams=5, temperature=1.2,  max_length=(len(
            text.split(' ')) + 10), skip_special_tokens=True,
            do_sample=True, repetition_penalty=1.2)[0]["generated_text"]
    process_time = time.time() - start
    return {"phrase": phrase,
            "time": process_time}
