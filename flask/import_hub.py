import tensorflow.compat.v1 as tf
import tensorflow_hub as hub
tf.disable_eager_execution()

print("Start")
embed = hub.Module("https://tfhub.dev/google/universal-sentence-encoder/2")
print("loading done embed")

embedding = embed(["The quick brown fox jumps over the lazy dog."])
print(embedding)