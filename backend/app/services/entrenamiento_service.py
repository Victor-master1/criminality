# --- Importaciones ---
import torch
import torch.nn as nn
from app.services.supabase_service import supabase
from app.services.analisis_service import obtener_dataframe_crudo
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.metrics import (
    accuracy_score, mean_squared_error, r2_score,
    recall_score, f1_score, roc_curve, roc_auc_score,
    confusion_matrix,
    precision_score
)
from sklearn.inspection import permutation_importance

from datetime import datetime
import json
import pandas as pd
import numpy as np
import uuid
import time

# --- Clase NeuralNet (Sin cambios) ---
class NeuralNet(nn.Module):
    def __init__(self, input_size, num_classes, is_regression=False):
        super(NeuralNet, self).__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU()
        )
        if is_regression:
            self.output_layer = nn.Linear(32, 1)
        else:
            # Para clasificación binaria, la salida es 1, para multiclase es num_classes
            self.output_layer = nn.Linear(32, num_classes if num_classes > 2 else 1)

    def forward(self, x):
        x = self.network(x)
        return self.output_layer(x)

def iniciar_nuevo_entrenamiento(config: dict):
    if config.get('columna_objetivo') in config.get('columnas_entrada', []):
        raise ValueError("La columna objetivo no puede estar incluida en las columnas de entrada.")

    # --- Inicialización de variables de experimento ---
    experimento_id = str(uuid.uuid4())
    estado_experimento = 'iniciando'
    tipo_problema_detectado = 'indefinido'

    try:
        # --- 1. Preparación de Datos ---
        start_time = time.time()
        dataset_id = config.get('dataset_id')
        tipo_modelo_usuario = config.get('tipo_modelo')
        columna_objetivo = config.get('columna_objetivo')
        print(f"🚀 Iniciando entrenamiento para: {dataset_id} con {tipo_modelo_usuario}")

        df = obtener_dataframe_crudo(dataset_id)
        for col in df.select_dtypes(include=np.number).columns:
            if df[col].isnull().sum() > 0: df[col].fillna(df[col].mean(), inplace=True)
        
        columnas_categoricas = [col for col in df.columns if df[col].dtype == 'object' and col != columna_objetivo]
        if columnas_categoricas: df = pd.get_dummies(df, columns=columnas_categoricas, drop_first=True)
        
        columnas_disponibles = [col for col in config['columnas_entrada'] if col in df.columns]
        X = df[columnas_disponibles].apply(pd.to_numeric, errors='coerce').fillna(0)
        y_raw = df[columna_objetivo]

        # --- 2. Detección y Validación del Tipo de Problema ---
        es_clasificacion = (pd.api.types.is_string_dtype(y_raw) or 
                            pd.api.types.is_categorical_dtype(y_raw) or 
                           (pd.api.types.is_integer_dtype(y_raw) and y_raw.nunique() <= 30))
        
        tipo_problema_detectado = "clasificacion" if es_clasificacion else "regresion"
        print(f"🧠 Tipo de problema detectado: {tipo_problema_detectado.upper()}")

        if tipo_modelo_usuario in ['clasificacion', 'regresion'] and tipo_modelo_usuario != tipo_problema_detectado:
            raise ValueError(f"Conflicto de tipos. Seleccionaste '{tipo_modelo_usuario}' pero la columna objetivo parece ser de '{tipo_problema_detectado}'.")

        le = LabelEncoder()
        if es_clasificacion:
            y = pd.Series(le.fit_transform(y_raw.fillna(y_raw.mode()[0])), name=columna_objetivo)
            if y.nunique() < 2:
                raise ValueError(f"La columna objetivo '{columna_objetivo}' debe tener al menos 2 clases para clasificar.")
        else:
            y = pd.to_numeric(y_raw, errors='coerce').fillna(y_raw.mean())

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=config.get('validacion_split', 0.2), random_state=42, stratify=y if es_clasificacion else None)
        scaler = StandardScaler(); X_train_scaled = scaler.fit_transform(X_train); X_test_scaled = scaler.transform(X_test)

        # --- 3. Entrenamiento del Modelo ---
        modelo_entrenado, predicciones, train_predicciones, metricas_por_epoca, tiempos_por_epoca = None, None, None, [], []

        if tipo_modelo_usuario == 'red_neuronal':
            print("-> Entrenando Red Neuronal (PyTorch)...")
            X_train_t = torch.tensor(X_train_scaled, dtype=torch.float32); X_test_t = torch.tensor(X_test_scaled, dtype=torch.float32)
            num_classes = y.nunique()
            
            y_train_torch = torch.tensor(y_train.values, dtype=torch.long)
            y_test_torch = torch.tensor(y_test.values, dtype=torch.long)

            if es_clasificacion:
                if num_classes == 2: 
                    y_train_t, y_test_t = y_train_torch.float().unsqueeze(1), y_test_torch.float().unsqueeze(1)
                else: 
                    y_train_t, y_test_t = y_train_torch, y_test_torch
            else: 
                y_train_t = torch.tensor(y_train.values, dtype=torch.float32).unsqueeze(1)
                y_test_t = torch.tensor(y_test.values, dtype=torch.float32).unsqueeze(1)

            modelo_entrenado = NeuralNet(X_train_t.shape[1], num_classes, is_regression=not es_clasificacion)
            criterion = nn.BCEWithLogitsLoss() if es_clasificacion and num_classes == 2 else nn.CrossEntropyLoss() if es_clasificacion else nn.MSELoss()
            optimizer = torch.optim.Adam(modelo_entrenado.parameters(), lr=config.get('tasa_aprendizaje', 0.001))
            
            for epoch in range(config.get('epocas', 100)):
                epoch_start_time = time.time()
                modelo_entrenado.train()
                outputs = modelo_entrenado(X_train_t); loss = criterion(outputs, y_train_t)
                optimizer.zero_grad(); loss.backward(); optimizer.step()
                
                modelo_entrenado.eval()
                with torch.no_grad():
                    train_outputs = modelo_entrenado(X_train_t)
                    train_loss = criterion(train_outputs, y_train_t)
                    val_outputs = modelo_entrenado(X_test_t)
                    val_loss = criterion(val_outputs, y_test_t)
                    
                    epoca_metrics = {
                        'epoca': epoch + 1, 
                        'perdida_validacion': float(val_loss.item()),
                        'perdida_entrenamiento': float(train_loss.item())
                    }
                    
                    if es_clasificacion:
                        train_labels, val_labels = None, None
                        if num_classes == 2:
                            train_labels = (torch.sigmoid(train_outputs) > 0.5).long().flatten()
                            val_labels = (torch.sigmoid(val_outputs) > 0.5).long().flatten()
                        else:
                            _, train_labels = torch.max(train_outputs.data, 1)
                            _, val_labels = torch.max(val_outputs.data, 1)
                        
                        epoca_metrics['precision_entrenamiento'] = precision_score(y_train, train_labels.numpy(), average='weighted', zero_division=0)
                        epoca_metrics['precision_validacion'] = precision_score(y_test, val_labels.numpy(), average='weighted', zero_division=0)
                    
                    metricas_por_epoca.append(epoca_metrics)
                
                epoch_end_time = time.time()
                tiempos_por_epoca.append(epoch_end_time - epoch_start_time)
            
            with torch.no_grad():
                # Predicciones finales sobre el conjunto de test
                final_outputs = modelo_entrenado(X_test_t)
                if es_clasificacion:
                    if num_classes == 2: predicciones = (torch.sigmoid(final_outputs) > 0.5).long().flatten().numpy()
                    else: _, predicciones = torch.max(final_outputs.data, 1); predicciones = predicciones.numpy()
                else: predicciones = final_outputs.numpy().flatten()
                
                # Predicciones finales sobre el conjunto de entrenamiento
                final_train_outputs = modelo_entrenado(X_train_t)
                if es_clasificacion:
                    if num_classes == 2: train_predicciones = (torch.sigmoid(final_train_outputs) > 0.5).long().flatten().numpy()
                    else: _, train_predicciones = torch.max(final_train_outputs.data, 1); train_predicciones = train_predicciones.numpy()
                else: train_predicciones = final_train_outputs.numpy().flatten()
        
        elif tipo_modelo_usuario == 'clasificacion':
            print("-> Entrenando Clasificación (Scikit-learn)...")
            modelo_entrenado = LogisticRegression(max_iter=1000, multi_class='ovr').fit(X_train_scaled, y_train)
            predicciones = modelo_entrenado.predict(X_test_scaled)
            train_predicciones = modelo_entrenado.predict(X_train_scaled)
        
        elif tipo_modelo_usuario == 'regresion':
            print("-> Entrenando Regresión (Scikit-learn)...")
            modelo_entrenado = LinearRegression().fit(X_train_scaled, y_train)
            predicciones = modelo_entrenado.predict(X_test_scaled)
            train_predicciones = modelo_entrenado.predict(X_train_scaled)

        end_time = time.time()
        
        # --- 4. CÁLCULO CONDICIONAL DE MÉTRICAS ---
        print("-> Calculando métricas y visualizaciones...")
        metricas = {}
        matriz_confusion, curva_roc, importancia_features, distribucion_errores, predicciones_vs_reales = None, None, None, None, None

        if predicciones is not None:
            if es_clasificacion:
                metricas = {
                    'accuracy': accuracy_score(y_test, predicciones),
                    'precision': precision_score(y_test, predicciones, average='weighted', zero_division=0),
                    'recall': recall_score(y_test, predicciones, average='weighted', zero_division=0),
                    'f1_score': f1_score(y_test, predicciones, average='weighted', zero_division=0),
                }
                
                if train_predicciones is not None:
                    metricas['precision_entrenamiento'] = precision_score(y_train, train_predicciones, average='weighted', zero_division=0)
                metricas['precision_validacion'] = metricas['precision']

                matriz_confusion = confusion_matrix(y_test, predicciones).tolist()
                
                if y.nunique() == 2:
                    print("-> Problema binario detectado. Calculando curva ROC...")
                    pred_prob = None
                    if hasattr(modelo_entrenado, 'predict_proba'):
                        pred_prob = modelo_entrenado.predict_proba(X_test_scaled)[:, 1]
                    elif tipo_modelo_usuario == 'red_neuronal':
                        with torch.no_grad():
                            pred_prob = torch.sigmoid(modelo_entrenado(X_test_t)).numpy().flatten()
                    
                    if pred_prob is not None:
                        fpr, tpr, _ = roc_curve(y_test, pred_prob)
                        curva_roc = {'auc': roc_auc_score(y_test, pred_prob), 'fpr': fpr.tolist(), 'tpr': tpr.tolist()}
            else: # REGRESSION
                mse_validacion = mean_squared_error(y_test, predicciones)
                r2 = r2_score(y_test, predicciones)
                
                mse_entrenamiento = None
                if train_predicciones is not None:
                    mse_entrenamiento = mean_squared_error(y_train, train_predicciones)

                metricas = {
                    'mse': mse_validacion,
                    'mse_validacion': mse_validacion,
                    'mse_entrenamiento': mse_entrenamiento,
                    'perdida_final': mse_validacion,
                    'r2_score': r2,
                }
                
                distribucion_errores = (y_test.values - predicciones).tolist()
                predicciones_vs_reales = [{'real': float(r), 'prediccion': float(p)} for r, p in zip(y_test.values, predicciones)]

        # --- Añadir/Sobrescribir métricas finales de la Red Neuronal ---
        if metricas_por_epoca:
            last_epoch_metrics = metricas_por_epoca[-1]
            metricas['perdida_final'] = last_epoch_metrics.get('perdida_validacion')

            if es_clasificacion:
                if 'precision_validacion' in last_epoch_metrics:
                    metricas['precision'] = last_epoch_metrics['precision_validacion']
                    metricas['precision_validacion'] = last_epoch_metrics['precision_validacion']
                if 'precision_entrenamiento' in last_epoch_metrics:
                    metricas['precision_entrenamiento'] = last_epoch_metrics['precision_entrenamiento']
            else: # REGRESSION (Neural Net)
                metricas['mse_entrenamiento'] = last_epoch_metrics.get('perdida_entrenamiento')
                metricas['mse_validacion'] = last_epoch_metrics.get('perdida_validacion')
                metricas['mse'] = last_epoch_metrics.get('perdida_validacion')

        print("-> Calculando importancia de features...")
        try:
            if tipo_modelo_usuario != 'red_neuronal':
                imps = permutation_importance(modelo_entrenado, X_test_scaled, y_test, n_repeats=10, random_state=42, n_jobs=-1)
                importancia_features = [{'feature': f, 'importancia': float(imp)} for f, imp in zip(X.columns, imps.importances_mean)]
            else:
                def scoring_func(estimator, X_perm, y_perm):
                    tensor_X = torch.tensor(X_perm, dtype=torch.float32)
                    with torch.no_grad():
                        preds = estimator(tensor_X)
                        if es_clasificacion:
                            if y.nunique() == 2: preds_labels = (torch.sigmoid(preds) > 0.5).long().flatten()
                            else: _, preds_labels = torch.max(preds.data, 1)
                            return accuracy_score(y_perm, preds_labels.numpy())
                        else:
                            return -mean_squared_error(y_perm, preds.numpy().flatten())
                
                imps = permutation_importance(modelo_entrenado, X_test_scaled, y_test.values, scoring=scoring_func, n_repeats=10, random_state=42, n_jobs=-1)
                importancia_features = [{'feature': f, 'importancia': float(imp)} for f, imp in zip(X.columns, imps.importances_mean)]
            
            importancia_features.sort(key=lambda x: x['importancia'], reverse=True)
        except Exception as imp_err:
            print(f"⚠️ No se pudo calcular la importancia de features: {imp_err}")
            importancia_features = None

        # --- 5. Guardar el experimento completo ---
        estado_experimento = 'completado'
        nuevo_experimento = {
            'id': experimento_id,
            'nombre': f"Experimento_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'dataset_id': dataset_id,
            'configuracion': json.dumps(config),
            'estado': estado_experimento,
            'fecha_creacion': datetime.utcnow().isoformat(),
            'tipo_problema': tipo_problema_detectado,
            'metricas': json.dumps({k: float(v) if v is not None else None for k, v in metricas.items()}),
            'metricas_por_epoca': json.dumps(metricas_por_epoca),
            'tiempo_por_epoca': json.dumps(tiempos_por_epoca),
            'matriz_confusion': json.dumps(matriz_confusion),
            'curva_roc': json.dumps(curva_roc),
            'distribucion_errores': json.dumps(distribucion_errores),
            'predicciones_vs_reales': json.dumps(predicciones_vs_reales),
            'importancia_features': json.dumps(importancia_features),
            'tiempo_total': end_time - start_time
        }

        result = supabase.table('experimentos').insert(nuevo_experimento).execute()
        if not result.data: raise Exception("No se pudo guardar el experimento en la base de datos.")
        
        print("🎉 Entrenamiento condicional completado y guardado correctamente.")
        return result.data[0]

    except Exception as e:
        print(f"🔥🔥🔥 Error detallado en el servicio de entrenamiento: {e}")
        # Guardar experimento con estado de error
        estado_experimento = 'error'
        experimento_fallido = {
            'id': experimento_id,
            'nombre': f"Experimento Fallido - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            'dataset_id': config.get('dataset_id'),
            'configuracion': json.dumps(config),
            'estado': estado_experimento,
            'fecha_creacion': datetime.utcnow().isoformat(),
            'tipo_problema': tipo_problema_detectado,
            'metricas': json.dumps({'error': str(e)})
        }
        supabase.table('experimentos').insert(experimento_fallido).execute()
        raise e

