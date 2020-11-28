from flask import Flask, jsonify
from flask import request

import tensorflow.compat.v1 as tf
import tensorflow_hub as hub
from pathlib import Path

from dotenv import load_dotenv
env_path = Path('../.env')
load_dotenv(dotenv_path=env_path)

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

tf.disable_eager_execution()
config = tf.ConfigProto()

app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello, World!"

def embed_text(text):
    g = tf.Graph()
    results = []
    with g.as_default():
        text_ph = tf.placeholder(dtype=tf.string, shape=[None])
        embed = hub.Module("https://tfhub.dev/google/universal-sentence-encoder/2")
        embeddings = embed(text_ph)
        session = tf.Session(graph=g, config=config)
        session.run(tf.global_variables_initializer())
        session.run(tf.tables_initializer())

        vectors = session.run(embeddings, feed_dict={text_ph: text})
        results = [vector.tolist() for vector in vectors]
    g.finalize()
    return results

@app.route("/query")
def query():
    query = request.args.get('key')
    query = query.split(',')
    print('query:', query, type(query))
    query_vector = embed_text(query)[0]

    return jsonify(query_vector)