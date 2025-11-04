#!/usr/bin/env python3
"""
Script para migrar la base de datos y añadir columnas nuevas a saved_games
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'basededatos.db')

if not os.path.exists(db_path):
    print("❌ Error: basededatos.db no existe")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("🔄 Migrando base de datos...")
    
    # Verificar si las columnas ya existen
    cursor.execute("PRAGMA table_info(saved_games)")
    columns = [col[1] for col in cursor.fetchall()]
    
    migrations = []
    
    if 'round' not in columns:
        migrations.append(("round", "ALTER TABLE saved_games ADD COLUMN round INTEGER DEFAULT 1"))
    
    if 'blind_target' not in columns:
        migrations.append(("blind_target", "ALTER TABLE saved_games ADD COLUMN blind_target INTEGER DEFAULT 300"))
    
    if 'chips' not in columns:
        migrations.append(("chips", "ALTER TABLE saved_games ADD COLUMN chips INTEGER DEFAULT 0"))
    
    if 'mult' not in columns:
        migrations.append(("mult", "ALTER TABLE saved_games ADD COLUMN mult INTEGER DEFAULT 0"))
    
    if not migrations:
        print("✅ La base de datos ya está actualizada")
    else:
        for col_name, sql in migrations:
            print(f"  ➕ Añadiendo columna '{col_name}'...")
            cursor.execute(sql)
        
        conn.commit()
        print(f"✅ Migración completada: {len(migrations)} columnas añadidas")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error durante la migración: {e}")
    exit(1)
