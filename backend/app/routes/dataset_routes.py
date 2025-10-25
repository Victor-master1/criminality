from flask import Blueprint, request, jsonify, send_file
from app.services.supabase_service import supabase
from app.services.limpieza_service import limpiar_dataset
from app.services.analisis_service import (
    obtener_dataframe_crudo,
    calcular_correlacion,
    distribucion_clases,
    estadisticas_dataset,
    obtener_columnas
)
import pandas as pd
import io
import requests
from datetime import datetime
from uuid import UUID
import uuid

dataset_bp = Blueprint("dataset_bp", __name__)


# =============================================================================
# SECCIÓN 1: RUTAS CRUD PARA DATASETS
# =============================================================================

@dataset_bp.route("/datasets", methods=["GET", "POST"])
def handle_datasets():
    """
    Maneja las solicitudes para la colección de datasets.
    - GET: Devuelve una lista de todos los datasets.
    - POST: Recibe un JSON con la URL de un archivo ya subido y crea el registro.
    """
    # --- Lógica para CREAR un nuevo registro de dataset (POST) ---
    if request.method == "POST":
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "JSON inválido o vacío"}), 400

            nombre = data.get("nombre")
            archivo_url = data.get("archivo_url")
            usuario_id = data.get("usuario_id")

            if not all([nombre, archivo_url, usuario_id]):
                return jsonify({"error": "Faltan datos en el JSON (nombre, archivo_url, usuario_id)"}), 400

            # El backend descarga el archivo desde la URL para analizarlo
            resp = requests.get(archivo_url)
            resp.raise_for_status() # Lanza un error si la descarga falla
            df = pd.read_csv(io.BytesIO(resp.content))
            filas, columnas = df.shape
            
            # Construye el objeto para insertar en la base de datos
            nuevo_dataset = {
                "nombre": nombre,
                "archivo_url": archivo_url,
                "filas": int(filas),
                "columnas": int(columnas),
                "fecha_subida": datetime.utcnow().isoformat(),
                "usuario_id": usuario_id,
                "es_limpio": False
            }

            result = supabase.table("datasets").insert(nuevo_dataset).execute()
            if result.data:
                return jsonify(result.data[0]), 201
            
            return jsonify({"error": "No se pudo insertar el registro en la base de datos", "details": str(result.get("error"))}), 500

        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"El backend no pudo descargar el archivo desde la URL: {e}"}), 500
        except Exception as e:
            print(f"🚨 ERROR en POST /datasets: {e}")
            return jsonify({"error": "Ocurrió un error inesperado al crear el dataset", "details": str(e)}), 500

    # --- Lógica para LISTAR todos los datasets (GET) ---
    if request.method == "GET":
        try:
            response = supabase.table("datasets").select("*").execute()
            return jsonify(response.data or []), 200
        except Exception as e:
            print(f"🚨 ERROR en GET /datasets: {e}")
            return jsonify({"error": "No se pudieron obtener los datasets", "details": str(e)}), 500


@dataset_bp.route("/datasets/<dataset_id>", methods=["DELETE"])
def eliminar_dataset(dataset_id):
    """
    Elimina un dataset de la base de datos.
    NOTA: La eliminación del archivo en Storage ahora la maneja el frontend.
    """
    try:
        result = supabase.table("datasets").delete().eq("id", dataset_id).execute()
        if result.data:
            return jsonify({"status": "ok", "message": "Registro de dataset eliminado correctamente"}), 200
        return jsonify({"error": "No se encontró el registro del dataset para eliminar"}), 404
    except Exception as e:
        print(f"🚨 ERROR en eliminar_dataset: {e}")
        return jsonify({"error": "Ocurrió un error al eliminar el registro", "details": str(e)}), 500


# =============================================================================
# SECCIÓN 2: RUTAS DE PROCESAMIENTO Y ANÁLISIS
# =============================================================================

@dataset_bp.route("/datasets/<dataset_id>/descargar", methods=["GET"])
def descargar_dataset(dataset_id):
    """
    Busca un dataset por su ID, descarga el archivo CSV desde Supabase Storage 
    y lo envía al usuario.
    """
    try:
        # 1. Buscar la URL del archivo en la base de datos
        dataset_res = supabase.table("datasets").select("archivo_url").eq("id", dataset_id).single().execute()
        
        if not dataset_res.data:
            return jsonify({"error": "No se encontró el dataset"}), 404

        archivo_url = dataset_res.data.get("archivo_url")
        if not archivo_url:
            return jsonify({"error": "El registro del dataset no tiene una URL de archivo"}), 404

        # 2. Descargar el archivo desde Supabase Storage
        nombre_archivo = archivo_url.split('/')[-1]
        
        file_bytes = supabase.storage.from_("datasets").download(nombre_archivo)
        
        if file_bytes is None:
            raise Exception("No se pudo descargar el archivo desde Storage.")
        
        # 3. Enviar el archivo al frontend
        return send_file(
            io.BytesIO(file_bytes),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f"{nombre_archivo}"
        )

    except Exception as e:
        print(f"🚨 ERROR en descargar_dataset: {e}")
        return jsonify({"error": "Ocurrió un error al intentar descargar el archivo", "details": str(e)}), 500
    
@dataset_bp.route("/datasets/<dataset_id>/limpiar", methods=["POST"])
def limpiar_dataset_route(dataset_id):
    """
    Pasa el ID del dataset y las operaciones seleccionadas al servicio de limpieza.
    """
    try:
        operaciones = request.get_json()
        if not operaciones:
            return jsonify({"error": "No se enviaron operaciones de limpieza"}), 400
            
        dataset_limpio_info = limpiar_dataset(dataset_id, operaciones)
        return jsonify(dataset_limpio_info), 200
    except Exception as e:
        print(f"🔥🔥🔥 ERROR EN RUTA /limpiar: {e} 🔥🔥🔥")
        return jsonify({"error": str(e)}), 500

def handle_analisis_route(analysis_function, dataset_id):
    """Función auxiliar para evitar repetir código en las rutas de análisis."""
    try:
        df = obtener_dataframe_crudo(dataset_id)
        resultado = analysis_function(df)
        return jsonify(resultado), 200
    except Exception as e:
        # El print ya se hace en el servicio, aquí solo devolvemos el error
        return jsonify({"error": f"Error al procesar la solicitud: {e}"}), 500

# --- Rutas de Análisis ---
@dataset_bp.route("/datasets/<dataset_id>/columnas", methods=["GET"])
def columnas_route(dataset_id): 
    return handle_analisis_route(obtener_columnas, dataset_id)

@dataset_bp.route("/datasets/<dataset_id>/vista-previa", methods=["GET"])
def vista_previa(dataset_id): 
    """
    ✅ CORREGIDO:
    Devuelve una vista previa paginada de los datos del dataset.
    - Reemplaza los valores nulos con el string '[NULL]'.
    - Envía metadatos completos para la paginación.
    """
    try:
        # 1. Obtener parámetros de paginación de la URL
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 100, type=int)

        # 2. Obtener el DataFrame completo
        df = obtener_dataframe_crudo(dataset_id)
        
        # 3. Calcular totales y offsets usando el DataFrame completo
        total_filas = len(df)
        total_paginas = (total_filas + per_page - 1) // per_page 

        # 4. Calcular los índices de inicio y fin para el slice
        start_index = (page - 1) * per_page
        end_index = min(start_index + per_page, total_filas)

        # 5. Cortar el DataFrame para la página actual
        df_paginado = df.iloc[start_index:end_index]
        
        # 6. ✅ CORRECCIÓN: Reemplazar NaN por el string '[NULL]' para el frontend
        datos_paginados = df_paginado.fillna('[NULL]').to_dict(orient='records')

        # 7. Construir la respuesta paginada con metadatos correctos
        respuesta = {
            "metadata": {
                "page": page,
                "per_page": per_page,
                "total_filas": total_filas,
                "total_paginas": total_paginas,
                "mostrando_de": start_index + 1 if total_filas > 0 else 0,
                "mostrando_hasta": end_index
            },
            "data": datos_paginados
        }
        
        return jsonify(respuesta), 200

    except Exception as e:
        print(f"🚨 ERROR en ruta /vista-previa: {e}")
        return jsonify({"error": "No se pudo obtener la vista previa", "details": str(e)}), 500


@dataset_bp.route("/datasets/<dataset_id>/estadisticas", methods=["GET"])
def estadisticas_route(dataset_id): 
    return handle_analisis_route(estadisticas_dataset, dataset_id)

@dataset_bp.route("/datasets/<dataset_id>/distribucion-clases", methods=["GET"])
def distribucion_clases_route(dataset_id): 
    return handle_analisis_route(distribucion_clases, dataset_id)

@dataset_bp.route("/datasets/<dataset_id>/correlacion", methods=["GET"])
def correlacion(dataset_id): 
    return handle_analisis_route(calcular_correlacion, dataset_id)
