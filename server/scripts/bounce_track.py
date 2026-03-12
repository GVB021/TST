import sys
import json
import os
from pydub import AudioSegment

def bounce_track(data_path, output_path):
    try:
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        # data = [ { "path": "...", "startTimeMs": 0 }, ... ]
        
        if not data:
            return json.dumps({"status": "error", "message": "Nenhum arquivo para processar"})

        # Encontrar a duração total necessária
        max_end_time = 0
        segments = []

        for item in data:
            if not os.path.exists(item['path']):
                continue
            
            # Carregar áudio
            # Pydub infere formato, mas vamos forçar wav se der erro
            seg = AudioSegment.from_file(item['path'])
            start_ms = int(item['startTimeMs'])
            end_ms = start_ms + len(seg)
            
            if end_ms > max_end_time:
                max_end_time = end_ms
            
            segments.append({
                "seg": seg,
                "start": start_ms
            })

        # Criar áudio base de silêncio
        # Pydub cria silêncio em ms
        # Adicionar uma margem de segurança
        final_mix = AudioSegment.silent(duration=max_end_time + 1000) 

        # Sobrepor os segmentos
        for item in segments:
            final_mix = final_mix.overlay(item['seg'], position=item['start'])

        # Exportar
        final_mix.export(output_path, format="wav")
        
        return json.dumps({
            "status": "success",
            "output_path": output_path,
            "duration_ms": len(final_mix)
        })

    except Exception as e:
        return json.dumps({"status": "error", "message": str(e)})

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"status": "error", "message": "Uso: python bounce_track.py <json_data_path> <output_path>"}))
        sys.exit(1)

    json_path = sys.argv[1]
    out_path = sys.argv[2]
    
    print(bounce_track(json_path, out_path))
