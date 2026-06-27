import os
import urllib.request
import zipfile
import sys

URL = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
ZIP_NAME = "node.zip"
EXTRACT_DIR = os.path.join(os.getcwd(), "node-local")

def download_node():
    print(f"Downloading Node.js from {URL}...")
    try:
        urllib.request.urlretrieve(URL, ZIP_NAME)
        print("Download complete!")
    except Exception as e:
        print(f"Failed to download: {e}")
        sys.exit(1)

def extract_node():
    print(f"Extracting to {EXTRACT_DIR}...")
    try:
        if not os.path.exists(EXTRACT_DIR):
            os.makedirs(EXTRACT_DIR)
        with zipfile.ZipFile(ZIP_NAME, 'r') as zip_ref:
            zip_ref.extractall(EXTRACT_DIR)
        print("Extraction complete!")
        # Clean up zip
        os.remove(ZIP_NAME)
    except Exception as e:
        print(f"Failed to extract: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_node()
    extract_node()
    print("Node.js is ready at node-local/node-v20.11.1-win-x64/")
