# from gensim.models import Word2Vec, KeyedVectors

import gensim.downloader
# print(list(gensim.downloader.info()['models'].keys()))

glove_vectors = gensim.downloader.load('fasttext-wiki-news-subwords-300')
