import pandas as pd
import io
import requests
from app.services.supabase_service import supabase
import numpy as np # Importamos numpy para manejar tipos de datos

# =============================================================================
# 1️⃣ Obtener DataFrame "Crudo" (Sin modificar)
# =============================================================================
def obtener_dataframe_crudo(dataset_id: str) -> pd.DataFrame:
    """
    Descarga el archivo CSV desde Supabase y lo carga en un DataFrame de Pandas,
    manteniendo los datos en su estado original (con valores nulos).
    """
    try:
        dataset_res = supabase.table("datasets").select("archivo_url").eq("id", dataset_id).single().execute()
        if not dataset_res.data:
            raise ValueError(f"❌ Dataset con ID '{dataset_id}' no encontrado.")

        archivo_url = dataset_res.data.get("archivo_url")
        if not archivo_url:
            raise ValueError("❌ El registro del dataset no tiene una URL de archivo.")

        resp = requests.get(archivo_url)
        resp.raise_for_status()

        df = pd.read_csv(io.BytesIO(resp.content))
        
        if df.empty:
            raise ValueError("⚠️ El dataset está vacío o no se pudo leer correctamente.")
        
        return df

    except Exception as e:
        print(f"🚨 [ERROR] en obtener_dataframe_crudo: {e}")
        # Re-lanzamos la excepción para que la ruta la capture y envíe un error 500
        raise

# =============================================================================
# 2️⃣ Funciones de Análisis (Reciben el DataFrame "Crudo")
# =============================================================================

def estadisticas_dataset(df: pd.DataFrame) -> dict:
    """
    Calcula estadísticas generales sobre el DataFrame.
    IMPORTANTE: Esta función debe recibir el DataFrame "crudo" ANTES de cualquier
    transformación para contar correctamente nulos y duplicados.
    """
    try:
        total_filas = int(len(df))
        total_columnas = int(df.shape[1])
        # Se cuentan los nulos y duplicados ANTES de cualquier limpieza
        total_nulos = int(df.isnull().sum().sum())
        total_duplicados = int(df.duplicated().sum())
        
        denominador = total_filas * total_columnas
        porcentaje_nulos = (total_nulos / denominador * 100) if denominador > 0 else 0.0

        return {
            "total_filas": total_filas,
            "total_columnas": total_columnas,
            "total_nulos": total_nulos,
            "total_duplicados": total_duplicados,
            "porcentaje_nulos": round(porcentaje_nulos, 2)
        }
    except Exception as e:
        print(f"🚨 [ERROR] en estadisticas_dataset: {e}")
        raise

def obtener_columnas(df: pd.DataFrame) -> list:
    """
    ✅ CORREGIDO:
    Obtiene información detallada de cada columna.
    - Incluye 'valores_completos' para el gráfico de barras.
    - Para columnas numéricas, añade 'min', 'max' y 'promedio'.
    """
    try:
        total_filas = len(df)
        info_columnas = []
        nulos_por_columna = df.isnull().sum()

        for c in df.columns:
            col_info = {
                "nombre": c, 
                "tipo": str(df[c].dtype),
                "valores_nulos": int(nulos_por_columna[c]),
                "valores_completos": total_filas - int(nulos_por_columna[c]),
                "valores_unicos": int(df[c].nunique())
            }
            
            # Si la columna es numérica, se añaden estadísticas adicionales
            if pd.api.types.is_numeric_dtype(df[c]):
                col_info["min"] = float(df[c].min())
                col_info["max"] = float(df[c].max())
                col_info["promedio"] = float(df[c].mean())

            info_columnas.append(col_info)
            
        return info_columnas
    except Exception as e:
        print(f"🚨 [ERROR] en obtener_columnas: {e}")
        raise

def calcular_correlacion(df: pd.DataFrame) -> dict:
    """Calcula la matriz de correlación para las columnas numéricas."""
    try:
        df_numerico = df.select_dtypes(include=np.number)
        if df_numerico.empty:
            return {"mensaje": "No hay columnas numéricas para calcular correlación."}
        # Rellenar nulos con 0 solo para el cálculo de correlación, no modifica el df original
        return df_numerico.fillna(0).corr().round(4).to_dict()
    except Exception as e:
        print(f"🚨 [ERROR] en calcular_correlacion: {e}")
        raise

def distribucion_clases(df: pd.DataFrame) -> list:
    """
    ✅ CORREGIDO:
    Calcula la distribución de la última columna (asumida como objetivo/clase).
    Devuelve una lista de diccionarios, formato ideal para Recharts.
    Ejemplo: [{"clase": "A", "cantidad": 100}, {"clase": "B", "cantidad": 50}]
    """
    try:
        if df.shape[1] == 0:
            return []
            
        columna_clase = df.columns[-1]
        distribucion = df[columna_clase].value_counts()
        
        return [
            {"clase": str(clase), "cantidad": int(cantidad)}
            for clase, cantidad in distribucion.items()
        ]
    except Exception as e:
        print(f"🚨 [ERROR] en distribucion_clases: {e}")
        raise
