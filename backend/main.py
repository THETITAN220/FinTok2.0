import os
import shutil
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from langchain_community.embeddings import CohereEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI # Import Gemini
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not COHERE_API_KEY:
    raise ValueError("Please set the COHERE_API_KEY environment variable in your .env file.")
if not GOOGLE_API_KEY:
    raise ValueError("Please set the GOOGLE_API_KEY environment variable in your .env file.")

pdf_dir = "docs"
documents = []

for filename in os.listdir(pdf_dir):
    if filename.lower().endswith(".pdf"):
        pdf_path = os.path.join(pdf_dir, filename)
        loader = PyPDFLoader(pdf_path)
        docs_loaded = loader.load()
        documents.extend(docs_loaded)

if not documents:
    raise ValueError("No PDF documents found in the docs directory.")

text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
docs = text_splitter.split_documents(documents)

embeddings = CohereEmbeddings(
    cohere_api_key=COHERE_API_KEY,
    model="embed-english-v2.0",
    user_agent="my_rag_app"
)

faiss_index_path = "vectorstore/faiss_index"

if not os.path.exists("vectorstore"):
    os.makedirs("vectorstore")

if os.path.exists(faiss_index_path):
    if os.path.isdir(faiss_index_path):
        shutil.rmtree(faiss_index_path)
    else:
        os.remove(faiss_index_path)

vectorstore = FAISS.from_documents(documents=docs, embedding=embeddings)
vectorstore.save_local(faiss_index_path)

retriever = vectorstore.as_retriever()

# Initialize Gemini model
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY) # Changed to Gemini

qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    query_text = data.get("query")
    if not query_text:
        return jsonify({"error": "No query provided."}), 400

    answer = qa_chain.run(query_text)
    return jsonify({"query": query_text, "answer": answer})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
