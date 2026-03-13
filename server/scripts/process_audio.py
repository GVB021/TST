import sys
import os
import json
import base64
import time
import tempfile
import urllib.parse
import urllib.request
import zipfile
from typing import Any
import librosa
import numpy as np
import soundfile as sf
from scipy import signal
from pydub import AudioSegment

DEFAULT_SR = 44100
SILENCE_TOP_DB = 30
_NISQA_RUNNER = None
_NISQA_ERROR = None

def process_audio(original_path, retake_path, output_path, start_time_ms=None):
    try:
        y_orig, sr = librosa.load(original_path, sr=DEFAULT_SR)
        y_retake, _ = librosa.load(retake_path, sr=DEFAULT_SR)

        y_retake_trimmed, _ = librosa.effects.trim(y_retake, top_db=SILENCE_TOP_DB)
        if len(y_retake_trimmed) < sr * 0.1:
            return {"status": "error", "message": "Retake muito curto ou vazio"}

        start_sample = int(((start_time_ms or 0) / 1000) * sr)
        search_window = sr * 2
        search_start = max(0, start_sample - search_window)
        search_end = min(len(y_orig), start_sample + len(y_retake_trimmed) + search_window)
        y_orig_segment = y_orig[search_start:search_end]

        correlation = signal.correlate(y_orig_segment, y_retake_trimmed, mode="valid", method="fft")
        peak = int(np.argmax(correlation))
        best_offset = search_start + peak

        fade_len = int(0.02 * sr)
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        if len(y_retake_trimmed) > 2 * fade_len:
            y_retake_trimmed[:fade_len] *= fade_in
            y_retake_trimmed[-fade_len:] *= fade_out

        end_sample = best_offset + len(y_retake_trimmed)
        if end_sample > len(y_orig):
            padding = np.zeros(end_sample - len(y_orig))
            y_final = np.concatenate((y_orig, padding))
        else:
            y_final = y_orig.copy()

        y_final[best_offset:end_sample] = y_retake_trimmed
        sf.write(output_path, y_final, sr)

        return {
            "status": "success",
            "output_path": output_path,
            "alignment": {
                "offset_ms": (best_offset / sr) * 1000,
                "duration_ms": (len(y_retake_trimmed) / sr) * 1000,
            },
        }
    except Exception as error:
        return {"status": "error", "message": str(error)}

def align_batch(payload):
    try:
        original_path = payload.get("originalPath")
        takes_payload = payload.get("takes", [])
        if not original_path or not isinstance(takes_payload, list):
            return {"status": "error", "message": "Payload invalido"}

        y_orig, sr = librosa.load(original_path, sr=DEFAULT_SR)
        results = []

        for item in takes_payload:
            take_id = item.get("id")
            take_path = item.get("path")
            hint_ms = float(item.get("hintMs") or 0)

            if not take_id or not take_path:
                results.append({"status": "error", "id": take_id, "message": "Take invalido"})
                continue

            try:
                y_take, _ = librosa.load(take_path, sr=sr)
                y_take_trimmed, _ = librosa.effects.trim(y_take, top_db=SILENCE_TOP_DB)
                if len(y_take_trimmed) < sr * 0.1:
                    results.append({"status": "error", "id": take_id, "message": "Take muito curto ou vazio"})
                    continue

                start_sample = int((hint_ms / 1000) * sr)
                search_window = sr * 2
                search_start = max(0, start_sample - search_window)
                search_end = min(len(y_orig), start_sample + len(y_take_trimmed) + search_window)
                y_orig_segment = y_orig[search_start:search_end]
                if len(y_orig_segment) <= len(y_take_trimmed):
                    results.append({"status": "error", "id": take_id, "message": "Janela de busca insuficiente"})
                    continue

                correlation = signal.correlate(y_orig_segment, y_take_trimmed, mode="valid", method="fft")
                peak = int(np.argmax(correlation))
                best_offset = search_start + peak

                results.append({
                    "status": "success",
                    "id": take_id,
                    "alignment": {
                        "offset_ms": (best_offset / sr) * 1000,
                        "duration_ms": (len(y_take_trimmed) / sr) * 1000,
                    }
                })
            except Exception as error:
                results.append({"status": "error", "id": take_id, "message": str(error)})

        return {"status": "success", "results": results}
    except Exception as error:
        return {"status": "error", "message": str(error)}

def sanitize_name(value):
    return "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in value).strip("_") or "track"

def ensure_local_audio(source, workspace_dir):
    if source.startswith("http://") or source.startswith("https://"):
        url_path = urllib.parse.urlparse(source).path
        filename = os.path.basename(url_path) or f"take_{int(time.time() * 1000)}.wav"
        local_path = os.path.join(workspace_dir, filename)
        with urllib.request.urlopen(source) as response, open(local_path, "wb") as target:
            target.write(response.read())
        return local_path
    if source.startswith("/uploads/"):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        return os.path.join(project_root, "public", source.lstrip("/"))
    return source

def upload_to_supabase(local_path, bucket_path):
    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        raise RuntimeError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios")

    endpoint = f"{supabase_url.rstrip('/')}/storage/v1/object/uploads/{bucket_path}"
    with open(local_path, "rb") as handle:
        data = handle.read()

    request = urllib.request.Request(
        endpoint,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "Content-Type": "audio/wav" if local_path.lower().endswith(".wav") else "application/zip",
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(request):
        pass

    public_url = f"{supabase_url.rstrip('/')}/storage/v1/object/public/uploads/{bucket_path}"
    return {"storage_path": bucket_path, "public_url": public_url}

def generate_full_track(active_takes):
    duration_ms = 0
    segments = []
    for take in active_takes:
        local_path = take["localPath"]
        start_ms = int(float(take.get("startTimeSeconds", 0)) * 1000)
        segment = AudioSegment.from_file(local_path)
        end_ms = start_ms + len(segment)
        duration_ms = max(duration_ms, end_ms)
        segments.append((start_ms, segment))

    timeline = AudioSegment.silent(duration=max(duration_ms, 1))
    for start_ms, segment in segments:
        timeline = timeline.overlay(segment, position=start_ms)
    return timeline

def generate_multitrack(active_takes):
    grouped = {}
    for take in active_takes:
        key = take.get("trackName") or f"{take.get('characterName', 'Unknown')} - {take.get('actorName', 'Unknown')}"
        grouped.setdefault(key, []).append(take)

    rendered = {}
    for track_name, track_takes in grouped.items():
        duration_ms = 0
        clips = []
        for take in track_takes:
            start_ms = int(float(take.get("startTimeSeconds", 0)) * 1000)
            segment = AudioSegment.from_file(take["localPath"])
            end_ms = start_ms + len(segment)
            duration_ms = max(duration_ms, end_ms)
            clips.append((start_ms, segment))

        timeline = AudioSegment.silent(duration=max(duration_ms, 1))
        for start_ms, segment in clips:
            timeline = timeline.overlay(segment, position=start_ms)
        rendered[track_name] = timeline
    return rendered

def execute_bounce(payload):
    takes = payload.get("takes", [])
    mode = payload.get("mode", "full_track")
    production_id = payload.get("productionId", "production")
    timestamp = int(time.time())

    if not takes:
        return {"status": "error", "message": "Nenhum take ativo informado"}

    with tempfile.TemporaryDirectory() as temp_dir:
        prepared_takes = []
        for take in takes:
            local_path = ensure_local_audio(take["audioUrl"], temp_dir)
            if not os.path.exists(local_path):
                continue
            enriched = dict(take)
            enriched["localPath"] = local_path
            prepared_takes.append(enriched)

        if not prepared_takes:
            return {"status": "error", "message": "Nao foi possivel baixar takes para processamento"}

        outputs = []
        if mode == "multitrack":
            rendered_tracks = generate_multitrack(prepared_takes)
            export_dir = os.path.join(temp_dir, "multitrack")
            os.makedirs(export_dir, exist_ok=True)
            zip_path = os.path.join(temp_dir, f"{sanitize_name(production_id)}_{timestamp}_multitrack.zip")

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
                for track_name, segment in rendered_tracks.items():
                    filename = f"{sanitize_name(track_name)}.wav"
                    local_track_path = os.path.join(export_dir, filename)
                    segment.export(local_track_path, format="wav")
                    archive.write(local_track_path, arcname=filename)

            storage_info = upload_to_supabase(zip_path, f"bounces/{sanitize_name(production_id)}/multitrack_{timestamp}.zip")
            outputs.append({
                "type": "multitrack_zip",
                "local_path": zip_path,
                "storage_path": storage_info["storage_path"],
                "public_url": storage_info["public_url"],
            })
        else:
            timeline = generate_full_track(prepared_takes)
            full_mix_path = os.path.join(temp_dir, f"{sanitize_name(production_id)}_{timestamp}_full_track.wav")
            timeline.export(full_mix_path, format="wav")
            storage_info = upload_to_supabase(full_mix_path, f"bounces/{sanitize_name(production_id)}/full_track_{timestamp}.wav")
            outputs.append({
                "type": "full_track",
                "local_path": full_mix_path,
                "storage_path": storage_info["storage_path"],
                "public_url": storage_info["public_url"],
            })

        return {"status": "success", "mode": mode, "outputs": outputs}

def parse_bounce_payload(raw_payload):
    try:
        decoded = base64.b64decode(raw_payload.encode("utf-8")).decode("utf-8")
        return json.loads(decoded)
    except Exception as error:
        raise RuntimeError(f"Payload de bounce invalido: {error}")

def _extract_mos_from_prediction(prediction: Any):
    if prediction is None:
        return None
    if isinstance(prediction, dict):
        keys = ("mos", "mos_pred", "MOS", "MOS_pred")
        for key in keys:
            value = prediction.get(key)
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, list) and value and isinstance(value[0], (int, float)):
                return float(value[0])
    if isinstance(prediction, (list, tuple)) and prediction:
        for value in prediction:
            mos = _extract_mos_from_prediction(value)
            if mos is not None:
                return mos
    if hasattr(prediction, "to_dict"):
        try:
            converted = prediction.to_dict()
            mos = _extract_mos_from_prediction(converted)
            if mos is not None:
                return mos
        except Exception:
            pass
    if hasattr(prediction, "item"):
        try:
            value = prediction.item()
            if isinstance(value, (int, float)):
                return float(value)
        except Exception:
            pass
    return None

def _build_nisqa_runner():
    model_path = os.environ.get("NISQA_MODEL_PATH", "")
    output_dir = os.environ.get("NISQA_OUTPUT_DIR", tempfile.gettempdir())

    try:
        from nisqa.NISQA_model import nisqaModel  # type: ignore
    except Exception:
        return None

    def runner(file_path):
        args = {
            "mode": "predict_file",
            "deg": file_path,
            "output_dir": output_dir,
            "csv_file": "nisqa_pred.csv",
        }
        if model_path:
            args["pretrained_model"] = model_path

        model = nisqaModel(args)
        prediction_result = model.predict()
        mos = _extract_mos_from_prediction(prediction_result)

        if mos is None and hasattr(model, "predictions"):
            mos = _extract_mos_from_prediction(model.predictions)

        if mos is None:
            raise RuntimeError("Nao foi possivel extrair MOS do NISQA")

        return float(mos)

    return runner

def _get_nisqa_runner():
    global _NISQA_RUNNER, _NISQA_ERROR
    if _NISQA_RUNNER is not None:
        return _NISQA_RUNNER
    if _NISQA_ERROR is not None:
        raise RuntimeError(_NISQA_ERROR)
    try:
        runner = _build_nisqa_runner()
        if runner is None:
            raise RuntimeError("Pacote NISQA indisponivel no ambiente Python")
        _NISQA_RUNNER = runner
        return _NISQA_RUNNER
    except Exception as error:
        _NISQA_ERROR = str(error)
        raise

def analyze_speech_quality(file_path):
    if not os.path.exists(file_path):
        raise RuntimeError("Arquivo para analise nao encontrado")
    runner = _get_nisqa_runner()
    mos = float(runner(file_path))
    return max(1.0, min(5.0, mos))

if __name__ == "__main__":
    try:
        if len(sys.argv) >= 3 and sys.argv[1] == "quality":
            mos_score = analyze_speech_quality(sys.argv[2])
            print(json.dumps({"status": "success", "quality_score": mos_score}))
            sys.exit(0)

        if len(sys.argv) >= 3 and sys.argv[1] == "bounce":
            payload = parse_bounce_payload(sys.argv[2])
            print(json.dumps(execute_bounce(payload)))
            sys.exit(0)

        if len(sys.argv) >= 3 and sys.argv[1] == "align_batch":
            payload = parse_bounce_payload(sys.argv[2])
            print(json.dumps(align_batch(payload)))
            sys.exit(0)

        if len(sys.argv) < 4:
            print(json.dumps({"status": "error", "message": "Uso: python process_audio.py <original> <retake> <output> [start_time_ms]"}))
            sys.exit(1)

        original = sys.argv[1]
        retake = sys.argv[2]
        output = sys.argv[3]
        start_ms = float(sys.argv[4]) if len(sys.argv) > 4 else 0
        print(json.dumps(process_audio(original, retake, output, start_ms)))
    except Exception as error:
        print(json.dumps({"status": "error", "message": str(error)}))
        sys.exit(1)
