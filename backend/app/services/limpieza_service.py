# app/services/limpieza_service.py

import pandas as pd
import numpy as np # Import numpy for NaN
from io import BytesIO
from app.services.supabase_service import supabase
from app.services.analisis_service import obtener_dataframe_crudo
from datetime import datetime

def limpiar_dataset(dataset_id: str, operaciones: dict):
    """
    ✅ ACTUALIZADO: Limpia el dataset, manejando whitespace y SIN One-Hot Encoding aquí.
    """
    try:
        df_original = obtener_dataframe_crudo(dataset_id)
        df_limpio = df_original.copy()

        filas_originales = len(df_limpio)
        
        print(f"⚙️ Operaciones recibidas: {operaciones}")

        # --- PASO 0: Limpieza PREVIA de Whitespace ---
        print("-> Aplicando limpieza de whitespace...")
        # 1. Quitar espacios al inicio/final de todas las celdas de texto
        for col in df_limpio.select_dtypes(include=['object', 'string']).columns:
            df_limpio[col] = df_limpio[col].str.strip()
            
        # 2. Reemplazar celdas vacías ("") o solo con espacios (" ") por NaN real
        df_limpio.replace(r'^\s*$', np.nan, regex=True, inplace=True)

        # --- Ahora calculamos nulos y duplicados DESPUÉS de limpiar espacios ---
        duplicados_originales = int(df_limpio.duplicated().sum()) # Duplicados reales
        nulos_originales = int(df_limpio.isnull().sum().sum())     # Nulos reales (incluye los convertidos)

        # --- PASO 1: Aplicar operaciones seleccionadas ---
        if operaciones.get('eliminar_duplicados'):
            print("-> Aplicando eliminación de duplicados...")
            df_limpio.drop_duplicates(inplace=True)

        if operaciones.get('eliminar_nulos'):
            print("-> Aplicando eliminación de nulos (NaN)...")
            df_limpio.dropna(inplace=True) # Ahora sí elimina los que eran solo espacios

        # --- PASO 2: Estadísticas Finales ---
        filas_limpias = len(df_limpio)
        filas_eliminadas = filas_originales - filas_limpias # Considera duplicados y nulos eliminados

        # --- PASO 3: Guardar y Subir ---
        csv_buffer = BytesIO()
        df_limpio.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        dataset_original_info = supabase.table("datasets").select("nombre, usuario_id").eq("id", dataset_id).single().execute().data
        nombre_base = dataset_original_info["nombre"].rsplit('.', 1)[0]
        nombre_archivo_limpio = f"{nombre_base}_limpio_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
        bucket = supabase.storage.from_("datasets")
        bucket.upload(nombre_archivo_limpio, csv_buffer.getvalue())
        archivo_url_limpio = bucket.get_public_url(nombre_archivo_limpio)
        
        nuevo_dataset_data = {
            "nombre": dataset_original_info["nombre"] + " (Limpio)",
            "archivo_url": archivo_url_limpio, "filas": filas_limpias,
            "columnas": len(df_limpio.columns), "fecha_subida": datetime.utcnow().isoformat(),
            "usuario_id": dataset_original_info["usuario_id"], "es_limpio": True,
            "dataset_original_id": dataset_id
        }
        insert_response = supabase.table("datasets").insert(nuevo_dataset_data).execute()
        dataset_limpio_creado = insert_response.data[0]
        
        # Recalcular duplicados/nulos eliminados para el resumen (puede ser complejo si se aplican ambos)
        # Simplificación: Usamos los conteos iniciales como referencia
        duplicados_eliminados_count = duplicados_originales if operaciones.get('eliminar_duplicados') else 0
        nulos_eliminados_count = nulos_originales if operaciones.get('eliminar_nulos') else 0
        # Nota: Si se eliminan duplicados y luego nulos, el conteo de nulos eliminados podría ser menor que el original.
        
        estadisticas_resumen = {
            "filas_originales": filas_originales, "filas_limpias": filas_limpias,
            "filas_eliminadas": filas_eliminadas,
            "duplicados_eliminados": duplicados_eliminados_count,
            "nulos_eliminados": nulos_eliminados_count,
        }
        resultado_final = {
            "mensaje": "Limpieza completada exitosamente.",
            "dataset_limpio_id": dataset_limpio_creado["id"],
            "estadisticas": estadisticas_resumen,
            "filas_resultantes": filas_limpias,
            "archivo_url": archivo_url_limpio
        }
        return resultado_final

    except Exception as e:
        print(f"🔥🔥🔥 Error detallado en limpiar_dataset: {type(e).__name__} - {e}")
        raise e