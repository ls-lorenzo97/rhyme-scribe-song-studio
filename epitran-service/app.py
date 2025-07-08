from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import epitran

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializza istanze Epitran per ogni lingua
epi_instances = {
    'en': epitran.Epitran('eng-Latn'),
    'it': epitran.Epitran('ita-Latn'),
    'es': epitran.Epitran('spa-Latn'),
    'fr': epitran.Epitran('fra-Latn'),
    'de': epitran.Epitran('deu-Latn')
}

class WordRequest(BaseModel):
    word: str
    language: str = 'en'

class RhymeRequest(BaseModel):
    word1: str
    word2: str
    language: str = 'en'

@app.post('/stress-tail')
def get_stress_tail(req: WordRequest):
    word = req.word.strip().lower()
    language = req.language.lower()
    if language not in epi_instances:
        return {"error": "Language not supported"}
    ipa = epi_instances[language].transliterate(word)
    stress_tail = ipa
    if 'ˈ' in ipa:
        stress_tail = ipa.split('ˈ')[-1]
    elif len(ipa) > 3:
        stress_tail = ipa[-3:]
    return {
        'word': word,
        'language': language,
        'ipa': ipa,
        'stress_tail': stress_tail,
        'success': True
    }

@app.post('/transliterate')
def transliterate(req: WordRequest):
    word = req.word.strip().lower()
    language = req.language.lower()
    if language not in epi_instances:
        return {"error": "Language not supported"}
    ipa = epi_instances[language].transliterate(word)
    return {"word": word, "language": language, "ipa": ipa}

@app.post('/detect_rhyme')
def detect_rhyme(req: RhymeRequest):
    language = req.language.lower()
    if language not in epi_instances:
        return {"error": "Language not supported"}
    ipa1 = epi_instances[language].transliterate(req.word1.strip().lower())
    ipa2 = epi_instances[language].transliterate(req.word2.strip().lower())
    # Extract stress tails
    def get_stress_tail(ipa):
        if 'ˈ' in ipa:
            return ipa.split('ˈ')[-1]
        elif len(ipa) > 3:
            return ipa[-3:]
        return ipa
    tail1 = get_stress_tail(ipa1)
    tail2 = get_stress_tail(ipa2)
    rhyme = tail1 == tail2
    return {
        'word1': req.word1,
        'word2': req.word2,
        'language': language,
        'ipa1': ipa1,
        'ipa2': ipa2,
        'stress_tail1': tail1,
        'stress_tail2': tail2,
        'rhyme': rhyme
    }

# To run: uvicorn app:app --host 0.0.0.0 --port 5000 --reload
