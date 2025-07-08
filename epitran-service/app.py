from flask import Flask, request, jsonify
from flask_cors import CORS
import epitran

app = Flask(__name__)
CORS(app)

# Inizializza istanze Epitran per ogni lingua
epi_instances = {
    'en': epitran.Epitran('eng-Latn'),
    'it': epitran.Epitran('ita-Latn'),
    'es': epitran.Epitran('spa-Latn'),
    'fr': epitran.Epitran('fra-Latn'),
    'de': epitran.Epitran('deu-Latn')
}

@app.route('/stress-tail', methods=['POST'])
def get_stress_tail():
    data = request.get_json()
    word = data.get('word', '').strip().lower()
    language = data.get('language', 'en').lower()
    
    if language not in epi_instances:
        return jsonify({'error': f'Language not supported'}), 400
    
    # Ottieni trascrizione IPA
    ipa = epi_instances[language].transliterate(word)
    
    # Estrai stress tail (parte dopo ultimo accento primario)
    stress_tail = ipa
    if 'ˈ' in ipa:
        stress_tail = ipa.split('ˈ')[-1]
    elif len(ipa) > 3:
        stress_tail = ipa[-3:]
        
    return jsonify({
        'word': word,
        'language': language,
        'ipa': ipa,
        'stress_tail': stress_tail,
        'success': True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
