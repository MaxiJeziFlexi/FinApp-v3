import sys
import os

from api.chat import generate_chat_reply

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ai.tree_model import TreeModel

def test_generate_chat_reply():
    messages = [{"role": "user", "content": "Cześć"}]
    reply = generate_chat_reply(messages)
    assert "Witaj" in reply

def test_tree_model_response():
    tree_model = TreeModel()
    response = tree_model.predict_response("Jak wygląda moja płynność?")
    assert "płynność" in response.lower()
