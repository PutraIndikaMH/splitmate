import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


class PositionalEmbedding(layers.Layer):
    def __init__(self, vocab_size, embed_dim, max_len, **kwargs):
        super().__init__(**kwargs)
        self.vocab_size = vocab_size
        self.embed_dim = embed_dim
        self.max_len = max_len
        self.embedding = layers.Embedding(vocab_size, embed_dim, mask_zero=True)
        self.pos_encoding = self._sinusoidal_encoding(max_len, embed_dim)

    def _sinusoidal_encoding(self, max_len, embed_dim):
        positions = np.arange(max_len)[:, np.newaxis]
        dims = np.arange(embed_dim)[np.newaxis, :]
        angles = positions / np.power(10000, (2 * (dims // 2)) / embed_dim)
        angles[:, 0::2] = np.sin(angles[:, 0::2])
        angles[:, 1::2] = np.cos(angles[:, 1::2])
        return tf.cast(angles[np.newaxis, :, :], dtype=tf.float32)

    def call(self, inputs):
        seq_len = tf.shape(inputs)[1]
        embedded = self.embedding(inputs)
        return embedded + self.pos_encoding[:, :seq_len, :]

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"vocab_size": self.vocab_size, "embed_dim": self.embed_dim, "max_len": self.max_len})
        return cfg


class SimpleAttention(layers.Layer):
    def __init__(self, units=128, **kwargs):
        super().__init__(**kwargs)
        self.units = units
        self.supports_masking = True
        self.W = layers.Dense(units, use_bias=False)
        self.v = layers.Dense(1, use_bias=False)

    def build(self, input_shape):
        feature_dim = int(input_shape[-1])
        self.W.build((None, feature_dim))
        self.v.build((None, self.units))
        super().build(input_shape)

    def call(self, lstm_output, mask=None):
        score = self.v(tf.nn.tanh(self.W(lstm_output)))
        if mask is not None:
            # Mask padded timesteps so attention ignores them.
            mask = tf.cast(mask, score.dtype)
            score = score + (1.0 - tf.expand_dims(mask, axis=-1)) * tf.constant(-1e9, dtype=score.dtype)
        weight = tf.nn.softmax(score, axis=1)
        context = tf.reduce_sum(weight * lstm_output, axis=1)
        return context

    def compute_mask(self, inputs, mask=None):
        # Attention pools sequence to one vector, no temporal mask is passed forward.
        return None

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"units": self.units})
        return cfg


class FocalLoss(keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):
        super().__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1.0 - 1e-7)
        cross_entropy = -y_true * tf.math.log(y_pred)
        focal_weight = self.alpha * tf.pow(1.0 - y_pred, self.gamma)
        return tf.reduce_mean(tf.reduce_sum(focal_weight * cross_entropy, axis=-1))

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"gamma": self.gamma, "alpha": self.alpha})
        return cfg
