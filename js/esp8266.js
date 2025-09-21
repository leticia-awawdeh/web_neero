// Configuração do ESP8266
const ESP8266_CONFIG = {
    ip: '192.168.1.100', // Altere para o IP do seu ESP8266
    timeout: 5000,
    retryAttempts: 3
};

let connectionStatus = {
    connected: false,
    lastCheck: null
};

// Enviar dados para ESP8266 com suporte RGB
async function sendToESP8266(endpoint, data) {
    try {
        let url = `http://${ESP8266_CONFIG.ip}/${endpoint}`;
        let requestData = data;
        
        // Para LED, usar formato compatível com ESP8266
        if (endpoint === 'led' && data.rgb) {
            url = `http://${ESP8266_CONFIG.ip}/setLed?r=${data.rgb.r}&g=${data.rgb.g}&b=${data.rgb.b}`;
            // GET request para compatibilidade com código ESP8266
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(ESP8266_CONFIG.timeout)
            });
            
            if (response.ok) {
                updateConnectionStatus(true);
                console.log(`✅ LED RGB enviado: R:${data.rgb.r}, G:${data.rgb.g}, B:${data.rgb.b}`);
                return await response.text();
            } else {
                console.error(`❌ Erro ESP8266 (${endpoint}):`, response.status);
                updateConnectionStatus(false);
                return null;
            }
        }
        
        // Para ventilador, usar formato motor speed
        if (endpoint === 'fan') {
            url = `http://${ESP8266_CONFIG.ip}/setMotor?speed=${data.speed}`;
            const response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(ESP8266_CONFIG.timeout)
            });
            
            if (response.ok) {
                updateConnectionStatus(true);
                console.log(`✅ Motor/Ventilador: ${data.speed}%`);
                return await response.text();
            } else {
                console.error(`❌ Erro ESP8266 (motor):`, response.status);
                updateConnectionStatus(false);
                return null;
            }
        }
        
        // Para outros endpoints, usar POST JSON
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(ESP8266_CONFIG.timeout)
        });
        
        if (response.ok) {
            const result = await response.json();
            updateConnectionStatus(true);
            console.log(`✅ ${endpoint.toUpperCase()} enviado:`, requestData);
            return result;
        } else {
            console.error(`❌ Erro ESP8266 (${endpoint}):`, response.status);
            updateConnectionStatus(false);
            return null;
        }
    } catch (error) {
        console.error(`🚫 Falha na conexão ESP8266 (${endpoint}):`, error.message);
        updateConnectionStatus(false);
        return null;
    }
}

// Testar conexão (adaptado para ESP8266)
async function testConnection() {
    try {
        // Tenta acessar a página principal do ESP8266
        const response = await fetch(`http://${ESP8266_CONFIG.ip}/`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
            updateConnectionStatus(true);
            console.log('🔗 ESP8266 conectado na página principal');
            return true;
        } else {
            updateConnectionStatus(false);
            return false;
        }
    } catch (error) {
        updateConnectionStatus(false);
        return false;
    }
}

// Função de demonstração offline
function demonstrateOffline() {
    console.log('🎭 Modo demonstração - ESP8266 não conectado');
    console.log('💡 Para conectar: Configure o IP em js/esp8266.js');
    console.log('🔧 Upload o código Arduino no ESP8266');
    console.log('📡 Conecte na rede "ESP8266-Controle"');
}

// Configurações avançadas do ESP8266
const ESP8266_ADVANCED = {
    // Configurações de rede
    accessPoint: {
        ssid: 'ESP8266-Controle',
        password: '12345678',
        defaultIP: '192.168.4.1'
    },
    
    // Mapeamento de pinos (conforme código ESP8266)
    pins: {
        led: {
            red: 2,    // GPIO2 (D4)
            green: 0,  // GPIO0 (D3) 
            blue: 4    // GPIO4 (D2)
        },
        motor: {
            speed: 5,  // ENA - GPIO5 (D1)
            pin1: 14,  // IN1 - GPIO14 (D5)
            pin2: 12   // IN2 - GPIO12 (D6)
        }
    },
    
    // Endpoints disponíveis
    endpoints: {
        home: '/',
        setLed: '/setLed',
        setMotor: '/setMotor'
    }
};

// Auto-detectar IP do ESP8266
async function autoDetectESP8266() {
    const commonIPs = [
        '192.168.4.1',      // AP padrão
        '192.168.1.100',    // Configuração atual
        '192.168.1.101',
        '192.168.0.100',
        '192.168.0.101'
    ];
    
    console.log('🔍 Procurando ESP8266 na rede...');
    
    for (const ip of commonIPs) {
        try {
            const response = await fetch(`http://${ip}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            
            if (response.ok) {
                const text = await response.text();
                if (text.includes('LED') || text.includes('Motor') || text.includes('ESP8266')) {
                    ESP8266_CONFIG.ip = ip;
                    updateConnectionStatus(true);
                    console.log(`✅ ESP8266 encontrado em: ${ip}`);
                    return ip;
                }
            }
        } catch (error) {
            // Continua tentando outros IPs
        }
    }
    
    console.log('❌ ESP8266 não encontrado automaticamente');
    demonstrateOffline();
    return null;
}

// Status detalhado da conexão
function getConnectionStatus() {
    return {
        connected: connectionStatus.connected,
        lastCheck: connectionStatus.lastCheck,
        currentIP: ESP8266_CONFIG.ip,
        uptime: connectionStatus.lastCheck ? 
            Date.now() - connectionStatus.lastCheck.getTime() : null,
        config: ESP8266_ADVANCED
    };
}

// Log de debug melhorado
function logESP8266Debug(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🔧 ESP8266: ${message}`);
    if (data) {
        console.log('📊 Dados:', data);
    }
}

// Monitoramento avançado
function startAdvancedMonitoring() {
    // Status a cada 30 segundos
    setInterval(() => {
        if (connectionStatus.connected) {
            logESP8266Debug('Status OK', getConnectionStatus());
        }
    }, 30000);
    
    // Auto-detect a cada 2 minutos se desconectado
    setInterval(async () => {
        if (!connectionStatus.connected) {
            logESP8266Debug('Tentando auto-detecção...');
            await autoDetectESP8266();
        }
    }, 120000);
}

// Inicialização melhorada
document.addEventListener('DOMContentLoaded', function() {
    logESP8266Debug('Inicializando sistema ESP8266...');
    
    // Tenta IP configurado primeiro
    setTimeout(async () => {
        const connected = await testConnection();
        
        if (!connected) {
            logESP8266Debug('IP configurado falhou, tentando auto-detecção...');
            await autoDetectESP8266();
        }
        
        // Iniciar monitoramento avançado
        startAdvancedMonitoring();
    }, 1000);
    
    logESP8266Debug('Sistema ESP8266 inicializado');
});