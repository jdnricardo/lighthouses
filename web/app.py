from flask import Flask, send_from_directory, render_template
import os

app = Flask(__name__, 
           static_folder='static',  # For CSS, JS, and other static files
           template_folder='templates')  # For HTML templates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 