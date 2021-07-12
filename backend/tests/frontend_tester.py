from fastapi import FastAPI
import time
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

origins = [
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost'
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Query(BaseModel):
    prompt: str
    complete_type: str
    bias_id: int


class Log(BaseModel):
    log: str
    text: str


@app.post("/phrase_complete/")
def phrase_complete(query: Query):
    query_text = query.prompt
    complete_type = query.complete_type
    start = time.time()

    # # Consider last 25 words
    # text = " ".join(query_text.split(" ")[-25:])

    # # Replace hyphens as they are not handled by word_tokenize
    # text = text.replace("-", " - ")

    # Generate Phrase completion using transformer pipeline
    phrase = "et some random phrase"

    process_time = time.time() - start

    return {"phrase": phrase,
            "time": process_time}


@ app.post("/submit")
def submit(log: Log):
    with open('log.txt', 'w') as f:
        f.write(log.log)

    return {"Log Received"}
