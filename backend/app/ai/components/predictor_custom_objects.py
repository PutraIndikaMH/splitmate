from tensorflow import keras
import tensorflow as tf


class AttentionLayer(keras.layers.Layer):
    def __init__(self, units: int = 64, **kwargs):
        super().__init__(**kwargs)
        self.units = units

    def build(self, input_shape):
        self.W = self.add_weight(name="W", shape=(input_shape[-1], self.units), initializer="glorot_uniform")
        self.b = self.add_weight(name="b", shape=(self.units,), initializer="zeros")
        self.v = self.add_weight(name="v", shape=(self.units, 1), initializer="glorot_uniform")

    def call(self, inputs):
        score = tf.nn.tanh(tf.tensordot(inputs, self.W, axes=[[2], [0]]) + self.b)
        attn = tf.nn.softmax(tf.squeeze(tf.tensordot(score, self.v, axes=[[2], [0]]), axis=-1), axis=1)
        ctx = tf.reduce_sum(inputs * tf.expand_dims(attn, -1), axis=1)
        return ctx, attn

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"units": self.units})
        return cfg


class WeightedHuberLoss(keras.losses.Loss):
    def __init__(self, delta: float = 0.1, over_penalty: float = 1.5, under_penalty: float = 1.0, **kwargs):
        super().__init__(**kwargs)
        self.delta = delta
        self.over_penalty = over_penalty
        self.under_penalty = under_penalty

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.float32)
        y_pred = tf.cast(y_pred, tf.float32)
        err = y_pred - y_true
        huber = tf.where(
            tf.abs(err) <= self.delta,
            0.5 * tf.square(err),
            self.delta * (tf.abs(err) - 0.5 * self.delta),
        )
        w = tf.where(err > 0, self.over_penalty, self.under_penalty)
        return tf.reduce_mean(w * huber)

    def get_config(self):
        cfg = super().get_config()
        cfg.update(
            {
                "delta": self.delta,
                "over_penalty": self.over_penalty,
                "under_penalty": self.under_penalty,
            }
        )
        return cfg

