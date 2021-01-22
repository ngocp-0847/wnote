from datetime import datetime
from elasticsearch import Elasticsearch
import pprint
from gensim import corpora
from gensim.utils import simple_preprocess
import numpy as np
from gensim import models

es = Elasticsearch()

res = es.search(index="wnote", body={"query": {"match_all": {}}})

def map_source_to_content(hitData):
    key = 'rawTextSearch'
    if key in hitData['_source']:
        return hitData['_source']['rawTextSearch']
    else:
        return ''

documents = list(map(map_source_to_content, res['hits']['hits']))
print(documents[:20], len(documents))


# Create a set of frequent words
stoplist = set('for a of the and to in'.split(' '))
# Lowercase each document, split it by white space and filter out stopwords
texts = [[word for word in document.lower().split() if word not in stoplist]
         for document in documents]

# Count word frequencies
from collections import defaultdict
frequency = defaultdict(int)
for text in texts:
    for token in text:
        frequency[token] += 1

processed_corpus = [[token for token in text if frequency[token] > 1] for text in texts]
dictionary = corpora.Dictionary(processed_corpus)
print('processed_corpus:', processed_corpus[:5])
print('documents:', documents[0])
print('simple_preprocess, doc2bow:', simple_preprocess(documents[0]), dictionary.doc2bow(simple_preprocess(documents[0])))
corpus = [dictionary.doc2bow(simple_preprocess(line)) for line in documents]
print('corpus:', corpus)