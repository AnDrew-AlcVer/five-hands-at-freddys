# 🃏 Five Hands at Freddy's — Roguelike Deckbuilder

Videojuego **roguelike de construcción de mazos (*deckbuilder*)** que fusiona la mecánica estratégica de manos de póker y multiplicadores de **Balatro** con la tensión y ambientación nocturna de **Five Nights at Freddy's**. 

Desarrollado como proyecto integral para la asignatura de **Ingeniería del Software (ISO)** en el Grado en Ingeniería Informática (EPSA - UPV), aplicando metodologías ágiles, control de versiones colaborativo, arquitectura basada en API REST y contenedorización.

---

## 🎮 Concepto y Mecánicas del Juego

* **Supervivencia por Rondas (Turnos de Noche):** El jugador debe superar la puntuación mínima de cada noche jugando combinaciones de póker antes de quedarse sin manos ni descartes disponibles.
* **Sinergias y Modificadores:** Uso de cartas especiales y comodines temáticos que alteran la puntuación base (*Chips* × *Mult*) para escalar exponencialmente las jugadas.
* **Lógica Cliente-Servidor:** Separación completa entre el motor de reglas/evaluación de jugadas en el *backend* y la interfaz interactiva en el *frontend*.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está estructurado bajo una arquitectura modular preparada para producción:

* **Frontend (`JavaScript`, `HTML5`, `CSS3`):** Interfaz gráfica interactiva, renderizado de cartas, animaciones de mesa, gestión de estados de la partida y comunicación asíncrona con el servidor.
* **Backend (`Python`):** API REST encargada de la lógica de negocio del juego, validación de manos de póker, cálculo de puntuaciones, gestión de mazos y estado de las rondas.
* **Infraestructura y Despliegue (`Docker`):** Contenedorización mediante `Dockerfile` y dependencias de producción aisladas para garantizar la portabilidad del entorno.

---

## 📂 Estructura del Repositorio

```text
five-hands-at-freddys/
├── docs/          # Documentación de Ingeniería del Software (requisitos, diagramas y entregas)
├── lib/           # Dependencias y librerías de soporte para producción
├── src/           # Código fuente de la aplicación (Backend API REST, lógica del juego y Frontend)
├── .gitignore     # Exclusión de archivos temporales y entornos locales
└── README.md      # Documentación general del proyecto
