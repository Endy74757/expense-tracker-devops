from flask import Flask

app = Flask(__name__)

@app.route('/')
def notification_home():
    return "Hello from Notification Service!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)