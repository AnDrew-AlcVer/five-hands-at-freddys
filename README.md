# 🃏 Five Hands at Freddy's — Roguelike Deckbuilder

Videojuego web **roguelike de construcción de mazos (*deckbuilder*)** que fusiona la mecánica estratégica de manos de póker y multiplicadores de **Balatro** con la ambientación de supervivencia nocturna de **Five Nights at Freddy's**.

Desarrollado como proyecto integral para la asignatura de **Ingeniería del Software (ISO)** en el Grado en Ingeniería Informática (EPSA - UPV), aplicando metodología ágil **Scrum**, arquitectura web con **Python (Flask/WSGI)** y despliegue en contenedores **Docker**.

---

## 🎮 Concepto y Mecánicas

* **Supervivencia por Rondas (Turnos de Noche):** El jugador debe alcanzar la puntuación objetivo de cada noche jugando combinaciones de póker antes de agotar sus manos y descartes.
* **Sistema de Puntuación y Modificadores:** Evaluación dinámica de jugadas combinando fichas base (*Chips*) y multiplicadores (*Mult*) alterados por cartas especiales.
* **Persistencia y Gestión de Partidas:** Almacenamiento de datos y estado del juego gestionado desde el servidor.

---

## 🛠️ Arquitectura y Stack Tecnológico

* **Backend (`Python`):** Servidor web estructurado en `src/app.py` y módulos lógicos en `src/py/`, expuesto para entornos de producción mediante **WSGI** (`src/wsgi.py`).
* **Frontend (`JavaScript`, `HTML5`, `CSS3`):** Plantillas dinámicas (`src/templates/`) y recursos estáticos (`src/static/`) para el renderizado interactivo de la mesa, cartas y animaciones.
* **Datos y Persistencia:** Gestión de base de datos y ficheros de configuración en `src/db/` y `src/data/`.
* **DevOps y Despliegue (`Docker`):** Entorno completamente contenedorizado mediante `Dockerfile` y `docker-compose.yml` para su ejecución directa en producción.
* **Gestión de Proyecto (`Scrum`):** Artefactos de planificación, seguimiento de sprints y documentación técnica alojados en `docs/scrum/`.

---

## 📂 Estructura del Repositorio

```text
five-hands-at-freddys/
├── docs/
│   └── scrum/               # Documentación ágil, sprints y entregables de Ingeniería del Software
├── lib/
│   └── requirements.txt     # Dependencias de producción del sistema
├── src/
│   ├── data/                # Datos base y configuraciones del juego
│   ├── db/                  # Esquemas y persistencia de base de datos
│   ├── py/                  # Módulos con la lógica de negocio y reglas del juego
│   ├── static/              # Estilos CSS, scripts JS e imágenes
│   ├── templates/           # Vistas HTML renderizadas por el servidor
│   ├── app.py               # Punto de entrada principal de la aplicación web
│   ├── wsgi.py              # Punto de entrada WSGI para servidor de producción
│   ├── Dockerfile           # Definición de la imagen del contenedor
│   ├── docker-compose.yml   # Orquestación del servicio
│   └── requirements.txt     # Dependencias del entorno de la aplicación
├── .gitignore
└── README.md
