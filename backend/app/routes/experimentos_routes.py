from flask import Blueprint, jsonify
from app.services.supabase_service import supabase
import json

experimentos_bp = Blueprint("experimentos_bp", __name__)

# --- Función Auxiliar para parsear JSON ---
def parse_experimento(experimento_data):
    if not experimento_data:
        return None
    
    json_columns = [
        'configuracion', 'metricas', 'metricas_por_epoca', 'matriz_confusion', 
        'curva_roc', 'importancia_features', 'distribucion_errores', 
        'predicciones_vs_reales', 'tiempo_por_epoca'
    ]
    
    parsed_experimento = experimento_data.copy()
    for col in json_columns:
        if col in parsed_experimento and isinstance(parsed_experimento[col], str):
            try:
                parsed_experimento[col] = json.loads(parsed_experimento[col])
            except (json.JSONDecodeError, TypeError):
                parsed_experimento[col] = None
                
    return parsed_experimento

# --- SOLUCIÓN: Ruta de "recientes" ---
# Esta ruta estática debe ir ANTES de la ruta dinámica "<experimento_id>"
@experimentos_bp.route("/recientes", methods=["GET"])
def obtener_experimentos_recientes():
    """
    Devuelve los 5 experimentos más recientes para el dashboard.
    """
    try:
        response = supabase.table("experimentos").select("*").order("fecha_creacion", desc=True).limit(5).execute()
        experimentos_list = [parse_experimento(exp) for exp in response.data]
        return jsonify(experimentos_list or []), 200
    except Exception as e:
        print(f"🚨 ERROR en obtener_experimentos_recientes: {e}")
        return jsonify({"error": "No se pudieron obtener los experimentos recientes"}), 500

# --- Ruta para OBTENER TODOS los experimentos ---
@experimentos_bp.route("/", methods=["GET"])
def listar_experimentos():
    try:
        response = supabase.table("experimentos").select("*").order("fecha_creacion", desc=True).execute()
        experimentos_list = [parse_experimento(exp) for exp in response.data]
        return jsonify(experimentos_list or []), 200
    except Exception as e:
        print(f"🚨 ERROR en listar_experimentos: {e}")
        return jsonify({"error": "No se pudieron obtener los experimentos"}), 500


# --- Ruta para OBTENER UN experimento por ID ---
# Esta ruta dinámica va DESPUÉS de "/recientes"
@experimentos_bp.route("/<experimento_id>", methods=["GET"])
def obtener_experimento(experimento_id):
    try:
        response = supabase.table("experimentos").select("*").eq("id", experimento_id).single().execute()
        
        if response.data:
            experimento_parsed = parse_experimento(response.data)
            return jsonify(experimento_parsed), 200
        else:
            return jsonify({"error": "Experimento no encontrado"}), 404
    except Exception as e:
        # Este es el error que estabas viendo
        print(f"🚨 ERROR en obtener_experimento: {e}")
        return jsonify({"error": "No se pudo obtener el experimento"}), 500


# --- Ruta para eliminar un experimento ---
@experimentos_bp.route("/<experimento_id>", methods=["DELETE"])
def eliminar_experimento(experimento_id):
    try:
        result = supabase.table("experimentos").delete().eq("id", experimento_id).execute()
        if result.data:
            return jsonify({"status": "ok", "message": "Experimento eliminado"}), 200
        return jsonify({"error": "No se encontró el experimento para eliminar"}), 404
    except Exception as e:
        print(f"🚨 ERROR en eliminar_experimento: {e}")
        return jsonify({"error": "Ocurrió un error al eliminar"}), 500