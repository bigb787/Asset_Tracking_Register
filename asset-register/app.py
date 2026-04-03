import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template

from database import init_db

load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-change-me")


@app.route("/")
def index():
    return render_template("index.html")


with app.app_context():
    init_db()


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
