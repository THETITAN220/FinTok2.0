import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain_community.embeddings import CohereEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Cohere
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
# Load environment variables from .env file
load_dotenv()

# Ensure your Cohere API key is set in your environment
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Please set the COHERE_API_KEY environment variable in your .env file.")

FLASH_API_KEY = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
SYSTEM_INSTRUCTION = os.getenv("SYSTEM_INSTRUCTION")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

conversation_history = []  # Store conversation context

@app.route('/flash', methods=['POST'])
def generate_flash_response():
    if not FLASH_API_KEY:
        return jsonify({"error": "Flash API key not found"}), 500

    data = request.json
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Add user message to history
    conversation_history.append(f"User: {prompt}")

    # Keep only the last 10 messages
    if len(conversation_history) > 10:
        conversation_history.pop(0)

    # Format conversation history
    context = "\n".join(conversation_history)

    # Call Google Flash API
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        headers={"Authorization": f"Bearer {FLASH_API_KEY}"},
        json={"contents": [{"role": "system", "text": SYSTEM_INSTRUCTION}, {"role": "user", "text": context}]}
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to generate AI response"}), 500

    result = response.json()
    ai_response = result.get("candidates", [{}])[0].get("content", {}).get("text", "No response")

    # Add AI response to history
    conversation_history.append(f"AI: {ai_response}")

    return jsonify({"response": ai_response})


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    if not SARVAM_API_KEY:
        return jsonify({"error": "API key not found"}), 500

    if 'file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['file']

    # Prepare form data for Sarvam AI
    sarvam_form_data = {
        "model": (None, "saaras:v2"),
        "language_code": (None, "unknown"),
        "with_timestamps": (None, "false"),
        "with_diarization": (None, "false"),
        "num_speakers": (None, "123"),
        "file": (audio_file.filename, audio_file.read(), audio_file.content_type)
    }

    response = requests.post(
        "https://api.sarvam.ai/speech-to-text-translate",
        headers={"api-subscription-key": SARVAM_API_KEY},
        files=sarvam_form_data
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to transcribe audio"}), 500

    data = response.json()
    transcript = data.get("transcript", "No transcript available")
    language_code = data.get("language_code", "unknown")

    return jsonify({"transcript": transcript, "languageCode": language_code, "rawResponse": data})
@app.route("/translate", methods=["POST"])
def translate():
    try:
        data = request.json
        input_text = data.get("input")
        target_language_code = data.get("target_language_code")

        if not input_text or not target_language_code:
            return jsonify({"error": "Missing required parameters"}), 400

        url = "https://api.sarvam.ai/translate"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
        }

        payload = {
            "input": input_text,
            "source_language_code": "en-IN",
            "target_language_code": target_language_code,
            "speaker_gender": "Male",
            "mode": "formal",
            "model": "mayura:v1",
            "enable_preprocessing": False,
            "output_script": "fully-native",
            "numerals_format": "international",
        }

        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code != 200:
            return jsonify({"error": response_data}), response.status_code

        return jsonify({"translated_text": response_data.get("translated_text", "")})
    except Exception as e:
        return jsonify({"error": "Translation failed", "details": str(e)}), 500

@app.route("/tts", methods=["POST"])
def text_to_speech():
    try:
        data = request.json
        text = data.get("text")
        language_code = data.get("language_code")

        if not text or not language_code:
            return jsonify({"error": "Missing text or language_code"}), 400

        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json",
        }

        payload = {
            "inputs": [text],
            "target_language_code": language_code,
            "audio_format": "wav",
            "sample_rate": 24000,
        }

        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()

        if response.status_code != 200:
            return jsonify({"error": response_data}), response.status_code

        if "audios" not in response_data or not response_data["audios"]:
            return jsonify({"error": "No audio data received"}), 500

        # Decode the base64 audio
        audio_binary = base64.b64decode(response_data["audios"][0])
        return audio_binary, 200, {
            "Content-Type": "audio/wav",
            "Content-Disposition": "inline; filename=output.wav"
        }
    except Exception as e:
        return jsonify({"error": "TTS conversion failed", "details": str(e)}), 500


# Define the path to your PDF documents (relative to main.py)
pdf_dir = "docs"
documents = []

# Load all PDF files from the docs directory
for filename in os.listdir(pdf_dir):
    if filename.lower().endswith(".pdf"):
        pdf_path = os.path.join(pdf_dir, filename)
        loader = PyPDFLoader(pdf_path)
        docs_loaded = loader.load()
        documents.extend(docs_loaded)

if not documents:
    raise ValueError("No PDF documents found in the docs directory.")

# Optionally, split the loaded documents into smaller chunks for better retrieval
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = text_splitter.split_documents(documents)

# Create Cohere embeddings instance with the required model parameter and user_agent
embeddings = CohereEmbeddings(
    cohere_api_key=COHERE_API_KEY,
    model="embed-english-v2.0",  # Specify the embedding model from Cohere
    user_agent="my_rag_app"
)

# Set the path to save/load the FAISS vectorstore
faiss_index_path = "vectorstore/faiss_index"

# Ensure the vectorstore directory exists
if not os.path.exists("vectorstore"):
    os.makedirs("vectorstore")

# If an index already exists, load it (with dangerous deserialization allowed),
# otherwise create a new one and save it.
if os.path.exists(faiss_index_path):
    vectorstore = FAISS.load_local(faiss_index_path, embeddings, allow_dangerous_deserialization=True)
else:
    vectorstore = FAISS.from_documents(documents=docs, embedding=embeddings)
    vectorstore.save_local(faiss_index_path)

# Create a retriever from the vector store
retriever = vectorstore.as_retriever()

# Initialize the Cohere language model for generation
llm = Cohere(cohere_api_key=COHERE_API_KEY, model="command", max_tokens=100)

# Create a Retrieval QA chain using the retriever and language model
qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

# Set up the Flask app
app = Flask(__name__)

@app.route("/query", methods=["POST"])
def query():
    """
    Expects a JSON payload with a "query" field.
    Returns an answer generated by the retrieval QA chain.
    """
    data = request.get_json()
    query_text = data.get("query")
    if not query_text:
        return jsonify({"error": "No query provided."}), 400

    # Get the answer using the QA chain
    answer = qa_chain.run(query_text)
    return jsonify({"query": query_text, "answer": answer})

if __name__ == "__main__":
    # Run the Flask app on port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)

