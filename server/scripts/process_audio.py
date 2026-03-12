import sys
import os
import json
import librosa
import numpy as np
import soundfile as sf
from scipy import signal

# Configurações padrão
DEFAULT_SR = 44100
SILENCE_TOP_DB = 30  # Ajustável conforme o ambiente

def process_audio(original_path, retake_path, output_path, start_time_ms=None):
    """
    Processa o áudio substituindo o trecho original pelo retake com alinhamento inteligente.
    """
    try:
        # Carregar arquivos
        y_orig, sr = librosa.load(original_path, sr=DEFAULT_SR)
        y_retake, _ = librosa.load(retake_path, sr=DEFAULT_SR)

        # 1. Silence Stripping no Retake
        # Remove silêncio inicial e final para focar apenas na fala útil
        y_retake_trimmed, index = librosa.effects.trim(y_retake, top_db=SILENCE_TOP_DB)
        
        # Se o retake for muito curto ou silêncio total, aborta
        if len(y_retake_trimmed) < sr * 0.1:  # Menos de 100ms
            return json.dumps({"status": "error", "message": "Retake muito curto ou vazio"})

        # 2. Alinhamento Temporal (Cross-Correlation)
        # Se tivermos um start_time aproximado (do timecode), usamos para restringir a busca
        # Senão, buscamos no áudio todo (pode ser lento para arquivos longos)
        
        # Para otimizar, vamos assumir que o retake deve estar próximo de onde o original estava
        # Mas como é substituição, a ideia é encontrar *onde* o retake se encaixa melhor no contexto
        # Se for substituição total de uma fala, o alinhamento pode ser feito comparando o início
        
        # Simplificação: Se o usuário não fornecer start_time, assumimos que o retake começa no início do arquivo original (0s)
        # Mas o ideal é usar o timecode do nome do arquivo.
        # Se start_time_ms for fornecido, convertemos para amostras
        
        start_sample = 0
        if start_time_ms is not None:
            start_sample = int((start_time_ms / 1000) * sr)
        
        # Margem de busca (ex: +/- 2 segundos ao redor do start_time esperado)
        search_window = sr * 2 
        search_start = max(0, start_sample - search_window)
        search_end = min(len(y_orig), start_sample + len(y_retake_trimmed) + search_window)
        
        y_orig_segment = y_orig[search_start:search_end]
        
        # Correlação Cruzada para alinhar
        correlation = signal.correlate(y_orig_segment, y_retake_trimmed, mode='valid', method='fft')
        peak = np.argmax(correlation)
        # O pico indica onde o retake começa dentro do segmento
        
        # Ajuste do offset real no arquivo original
        best_offset = search_start + peak
        
        # 3. Substituição (Crossfade ou Hard Cut)
        # Para evitar cliques, idealmente faríamos um crossfade de 10-20ms nas bordas
        fade_len = int(0.02 * sr) # 20ms
        
        # Criar fades no retake
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        
        if len(y_retake_trimmed) > 2 * fade_len:
            y_retake_trimmed[:fade_len] *= fade_in
            y_retake_trimmed[-fade_len:] *= fade_out
            
        # Inserir no original
        # Se o retake for maior que o original a partir do ponto de inserção, estendemos
        end_sample = best_offset + len(y_retake_trimmed)
        
        if end_sample > len(y_orig):
            # Estender array original com zeros
            padding = np.zeros(end_sample - len(y_orig))
            y_final = np.concatenate((y_orig, padding))
        else:
            y_final = y_orig.copy()
            
        # Substituição simples (pode ser melhorado com crossfade na junção com o original)
        # Aqui estamos sobrepondo (mix) ou substituindo? O usuário pediu "substituir o áudio original"
        # Então vamos substituir (zerar o original naquele trecho e somar o novo)
        
        # Aplicar fade out no original antes da entrada do retake e fade in depois da saída
        # (Isso é complexo de fazer perfeito sem saber o contexto exato, mas vamos tentar suavizar)
        
        y_final[best_offset:end_sample] = y_retake_trimmed

        # Salvar resultado
        sf.write(output_path, y_final, sr)
        
        return json.dumps({
            "status": "success",
            "output_path": output_path,
            "alignment": {
                "offset_ms": (best_offset / sr) * 1000,
                "duration_ms": (len(y_retake_trimmed) / sr) * 1000
            }
        })

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"status": "error", "message": "Uso: python process_audio.py <original> <retake> <output> [start_time_ms]"}))
        sys.exit(1)

    original = sys.argv[1]
    retake = sys.argv[2]
    output = sys.argv[3]
    start_ms = float(sys.argv[4]) if len(sys.argv) > 4 else 0

    print(process_audio(original, retake, output, start_ms))
