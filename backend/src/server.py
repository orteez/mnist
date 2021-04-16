# Load libraries
import flask
import json
import requests
from keras.models import load_model, model_from_json
from base64 import b64decode
from PIL import Image
import io
import boto3
import datetime
from numpy import asarray, min, ptp, argmax
import logging

BUCKET_NAME='ortiz-mnist'

client = boto3.client('s3')

# instantiate flask 
app = flask.Flask(__name__)

with open('../../models/mnist_keras_model.json') as f:
    model = f.read()
    model = model_from_json(model)
    model.load_weights("../../models/mnist_keras_model.h5")
    model.compile()

def decode_compress_image(image):
    _, encoded = image.split(",", 1)
    data = b64decode(encoded)

    image = Image.open(io.BytesIO(data))
    image = image.resize((28, 28))
    image_data = asarray(image)[:,:,3]
    image = (image_data - min(image_data)) / ptp(image_data)
    image = image.reshape((1, 28,28, 1))
    return image

# define a predict function as an endpoint 
@app.route("/predict", methods=["POST"])
def predict():
    content = flask.request.json

    image = content["data"]

    if image is None:
        return flask.jsonify({"success": False, "error": "No input"})

    try:
        image = decode_compress_image(image)
    except:
        return flask.jsonify({"success": False, "error": "Failed to parse data."})

    predictions = model.predict(image)
    most_likely = argmax(predictions[0])

    predictions = [float(x) * 100 for x in predictions[0]]

    return flask.jsonify({"success": True, "prediction": int(most_likely), "predictions": predictions}) 

# define a correction function as an endpoint 
@app.route("/correction", methods=["POST"])
def correction():
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
    content = flask.request.json

    image = content["image"]
    number = content["number"]

    try:
        number = int(number)
    except:
        return flask.jsonify({"success": False, "error": "Can not parse number..."})

    # Check if the number for the correction is within the normal range of digits
    if number is None or number < 0 or number > 10:
        return flask.jsonify({"success": False, "error": "Number was not between 0 and 9"})

    try:
        image = decode_compress_image(image)
        body = image.flatten().tobytes()
    except Exception as e:
        print(e)
        return flask.jsonify({"success": False, "error": "Failed to parse image."})

    resp = client.put_object(Body=body, Bucket=BUCKET_NAME, Key='images/ortiz-{}-{}.txt'.format(timestamp, number))

    return flask.jsonify(resp) 

@app.route("/", methods=["GET"])
def root_route():
    return flask.jsonify(success=True)

# start the flask app, allow remote connections 
app.run(host='0.0.0.0', debug=True)
