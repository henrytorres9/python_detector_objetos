from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import base64

app = Flask(__name__, static_url_path='/static', static_folder='static')

prototxt_path = "MobileNetSSD_deploy.prototxt.txt"
model_path = "MobileNetSSD_deploy.caffemodel"
min_confidence = 0.1
classes = ["background", "aeroplane", "bicycle", "bird", "boat", "bottle", "bus", "car", "cat", "chair", "cow", "diningtable", "dog", "horse", "motorbike", "person", "pottedplant", "sheep", "sofa", "train", "tvmonitor"]
np.random.seed(543210)
colors = np.random.uniform(0, 255, size=(len(classes), 3))

net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect_objects():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    image = request.files['file']
    if image.filename == '':
        return jsonify({'error': 'No selected file'})

    image_np = np.fromfile(image, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    height, width = image.shape[0], image.shape[1]
    blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 0.007, (300, 300), 130)

    net.setInput(blob)
    detected_objects = net.forward()

    results = []

    for i in range(detected_objects.shape[2]):
        confidence = float(detected_objects[0][0][i][2])  # Convertir a float
        if confidence > min_confidence:
            class_index = int(detected_objects[0, 0, i, 1])
            upper_left_x = int(detected_objects[0, 0, i, 3] * width)
            upper_left_y = int(detected_objects[0, 0, i, 4] * height)
            lower_right_x = int(detected_objects[0, 0, i, 5] * width)
            lower_right_y = int(detected_objects[0, 0, i, 6] * height)
            prediction_text = f"{classes[class_index]}: {confidence:.2f}%"
            cv2.rectangle(image, (upper_left_x, upper_left_y), (lower_right_x, lower_right_y), colors[class_index], 3)
            cv2.putText(image, prediction_text, (upper_left_x, upper_left_y - 15 if upper_left_y > 30 else upper_left_y + 15), cv2.FONT_HERSHEY_COMPLEX, 0.6, colors[class_index], 2)
            results.append({"label": classes[class_index], "confidence": confidence})

    _, img_encoded = cv2.imencode('.jpg', image)
    image_data = base64.b64encode(img_encoded).decode('utf-8')
    
    return jsonify({"image_data": image_data, "results": results})

if __name__ == '__main__':
    app.run()
