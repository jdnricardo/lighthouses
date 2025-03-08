from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_url_path='', static_folder='.')

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=8000) 