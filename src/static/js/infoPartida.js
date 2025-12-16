function abrirInfoPartida() {
    const html = `
        <div id="configModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 9999;">
            <div style="background: #1a1a3e; border: 3px solid #ffaa44; border-radius: 15px; padding: 20px; max-width: 85%; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);">
                <div style="border-bottom: 2px solid #ffaa44; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #ffaa44; margin: 0; font-size: 1.8em; text-align: center;">Información de la Partida</h2>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Cómo se calculan los puntos</h3>
                        <p style="margin: 8px 0; line-height: 1.6; color: #ddd;"><strong>Puntuación = Fichas × Multiplicador</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;"><strong>Fichas:</strong> Suma del valor de tus cartas + bonus de la combinación.</li>
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;"><strong>Multiplicador:</strong> Depende del tipo de mano que hayas jugado (pareja, trío, etc.).</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Combinaciones y sus valores</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background: rgba(0, 0, 0, 0.2);">
                            <tr style="background: #2c3e50;">
                                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #34495e; color: #ecf0f1;">Combinación</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #34495e; color: #ecf0f1;">Fichas Base</th>
                                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #34495e; color: #ecf0f1;">Multiplicador</th>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Escalera de Color</td>
                                <td style="padding: 8px; color: #ddd;">+100</td>
                                <td style="padding: 8px; color: #ddd;">×8</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Poker (4 iguales)</td>
                                <td style="padding: 8px; color: #ddd;">+60</td>
                                <td style="padding: 8px; color: #ddd;">×7</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Full (3+2)</td>
                                <td style="padding: 8px; color: #ddd;">+45</td>
                                <td style="padding: 8px; color: #ddd;">×4</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Color (5 mismo palo)</td>
                                <td style="padding: 8px; color: #ddd;">+40</td>
                                <td style="padding: 8px; color: #ddd;">×4</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Escalera</td>
                                <td style="padding: 8px; color: #ddd;">+35</td>
                                <td style="padding: 8px; color: #ddd;">×4</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Trío</td>
                                <td style="padding: 8px; color: #ddd;">+35</td>
                                <td style="padding: 8px; color: #ddd;">×3</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Doble Pareja</td>
                                <td style="padding: 8px; color: #ddd;">+30</td>
                                <td style="padding: 8px; color: #ddd;">×2</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #444;">
                                <td style="padding: 8px; color: #ddd;">Pareja</td>
                                <td style="padding: 8px; color: #ddd;">+15</td>
                                <td style="padding: 8px; color: #ddd;">×2</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; color: #ddd;">Carta más alta</td>
                                <td style="padding: 8px; color: #ddd;">+0</td>
                                <td style="padding: 8px; color: #ddd;">×1</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Lista de Jokers</h3>
                        <p style="margin: 8px 0; line-height: 1.6; color: #ddd;">Los Jokers son potenciadores especiales que compras en la tienda. Puedes tener hasta 5 activos simultáneamente.</p>
                        
                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 15px;">
                            <h4 style="color: #e74c3c; margin: 0 0 10px 0; font-size: 14px;">JOKERS DE FICHAS</h4>
                            <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em;">
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Freddy Fazbear</strong> ($15)<br>
                                    Si juegas cartas Face (J, Q, K), suma +30 fichas.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Chica</strong> ($12)<br>
                                    Cada corazón jugado suma +25 fichas.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Balloon Boy</strong> ($10)<br>
                                    Cada 2 descartes acumula +20 fichas para la próxima jugada.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Ballora</strong> ($16)<br>
                                    Por cada par de cartas consecutivas suma +35 fichas.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Music Man</strong> ($17)<br>
                                    Cada carta jugada suma +5 fichas.
                                </li>
                            </ul>
                        </div>

                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 15px;">
                            <h4 style="color: #3498db; margin: 0 0 10px 0; font-size: 14px;">JOKERS DE MULTIPLICADOR</h4>
                            <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em;">
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Bonnie</strong> ($12)<br>
                                    Cada pica jugada suma +1 al multiplicador.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Foxy</strong> ($14)<br>
                                    La primera mano de la ronda suma +4 al multiplicador.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Mangle</strong> ($18)<br>
                                    33% de probabilidad por carta de sumar +1 al multiplicador.
                                </li>
                            </ul>
                        </div>

                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 15px;">
                            <h4 style="color: #9b59b6; margin: 0 0 10px 0; font-size: 14px;">JOKERS MULTIPLICADORES</h4>
                            <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em;">
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Springtrap</strong> ($20)<br>
                                    Si juegas cartas bajas (2, 3, 4, 5), multiplica x2 el multiplicador.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">The Puppet</strong> ($22)<br>
                                    Si no hay cartas repetidas, multiplica x2 el multiplicador (1 vez por ronda).
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Circus Baby</strong> ($19)<br>
                                    Si hay exactamente una pareja, multiplica x2 el multiplicador.
                                </li>
                            </ul>
                        </div>

                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 15px;">
                            <h4 style="color: #f39c12; margin: 0 0 10px 0; font-size: 14px;">JOKERS ESPECIALES</h4>
                            <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em;">
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Golden Freddy</strong> ($25)<br>
                                    Multiplica el multiplicador por un valor aleatorio entre x1.2 y x2.0.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Phone Guy</strong> ($13)<br>
                                    Una vez por ronda, convierte una carta en J.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">The Mimic</strong> ($24)<br>
                                    Copia el efecto del Joker más a la izquierda.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Sistema de Powerups</h3>
                        <p style="margin: 8px 0; line-height: 1.6; color: #ddd;">Antes de empezar una partida, puedes seleccionar una baraja que te dará ventajas especiales.</p>
                        
                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-top: 15px;">
                            <ul style="margin: 8px 0; padding-left: 20px; font-size: 0.85em;">
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Five Nights At Freddy's (FNAF1)</strong><br>
                                    +15 monedas extra solo en la primera ronda.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Five Nights At Freddy's 2 (FNAF2)</strong><br>
                                    +1 descarte disponible por ronda.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Five Nights At Freddy's 3 (FNAF3)</strong><br>
                                    +1 mano disponible por ronda.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Five Nights At Freddy's 4 (FNAF4)</strong><br>
                                    Multiplica x2 todas las recompensas de dinero al ganar rondas.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Sister Location</strong><br>
                                    +10 puntos extra en cada jugada de cartas.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Pizzeria Simulator</strong><br>
                                    Multiplica x2 el puntaje de cada jugada.
                                </li>
                                <li style="margin: 6px 0; line-height: 1.5; color: #ddd;">
                                    <strong style="color: #ffaa44;">Security Breach</strong><br>
                                    +1 jugada extra por ronda.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Valores de las Cartas</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;">Números (2–10): Su valor numérico.</li>
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;">J: 10 puntos</li>
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;">Q: 11 puntos</li>
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;">K: 12 puntos</li>
                            <li style="margin: 8px 0; line-height: 1.5; color: #ddd;">A: 13 puntos</li>
                        </ul>
                    </div>
                </div>

                <div style="padding-top: 15px; border-top: 1px solid #444; display: flex; justify-content: center;">
                    <button class="config-btn-close" onclick="cerrarInfoPartida()" style="background: #ffaa44; color: #1a1a3e; border: none; padding: 10px 30px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold;">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.id = 'infoPartidaContainer';
    container.innerHTML = html;
    document.body.appendChild(container);
    
    document.getElementById('configModal').addEventListener('click', (e) => {
        if (e.target.id === 'configModal') {
            cerrarInfoPartida();
        }
    });
}

function cerrarInfoPartida() {
    const container = document.getElementById('infoPartidaContainer');
    if (container) {
        container.remove();
    }
}
