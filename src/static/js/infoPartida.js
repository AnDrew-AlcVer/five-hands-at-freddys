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
                        <h3 style="color: #f39c12; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Qué hacen los Jokers</h3>
                        <p style="margin: 8px 0; line-height: 1.6; color: #ddd;">Los Jokers son potenciadores que compras en la tienda:</p>
                        <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Freddy:</strong> Si hay Face (J, Q, K), +20 fichas.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Bonnie:</strong> Cada pica que juegas añade +1 multiplicador.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Chica:</strong> Cada corazón que juegas añade +20 fichas.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Springtrap:</strong> Si juegas cartas bajas (2–5), multiplica ×2 el multiplicador.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Foxy:</strong> La primera mano de la ronda suma +2 multiplicador.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Balloon Boy:</strong> Cada 2 descartes acumulan +20 fichas para la próxima jugada.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Mangle:</strong> 33% de probabilidad por carta de sumar +1 multiplicador.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Puppet:</strong> Si no hay cartas repetidas, multiplica ×2 el multiplicador (1 vez por ronda).</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Golden Freddy:</strong> Multiplica el multiplicador por un valor aleatorio (×1.2 a ×2).</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Ballora:</strong> Cartas consecutivas suman +15 fichas.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Circus Baby:</strong> Si hay exactamente una pareja, multiplica ×2 el multiplicador.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Music Man:</strong> Cada carta jugada suma +1 ficha.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Phone Guy:</strong> Una carta se convierte en J una vez por ronda.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Mimic:</strong> Copia el efecto del Joker más a la izquierda.</li>
                            <li style="margin: 6px 0; line-height: 1.5; color: #ddd;"><strong>Stack Bonus:</strong> Jugar exactamente 3/4/5 cartas suma +20/+30/+50 fichas.</li>
                        </ul>
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
