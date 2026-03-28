import nltk
try:
    nltk.download('punkt', force=True)
    nltk.download('punkt_tab', force=True)
    print("NLTK data downloaded successfully.")
except Exception as e:
    print(f"Error downloading NLTK data: {e}")
