// Estados dos dispositivos
let deviceStates = {
    led: {
        on: false,
        color: '#ff0000',
        brightness: 80
    },
    computer: {
        on: false
    },
    fan: {
        speed: 0
    }
};

// Inicializar automação com debug
function initializeAutomation() {
    console.log('🎛️ Inicializando controles da automação...');
    
    // Debug: verificar se elementos existem
    const canvas = document.getElementById('colorWheelCanvas');
    const selector = document.getElementById('colorSelector');
    const fanSlider = document.getElementById('fanSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    
    console.log('🔍 Elementos encontrados:', {
        canvas: !!canvas,
        selector: !!selector, 
        fanSlider: !!fanSlider,
        brightnessSlider: !!brightnessSlider
    });
    
    // Inicializar color wheel canvas
    initializeColorWheel();
    resizeColorWheel();

    
    // Event listeners para sliders
    if (fanSlider) {
        fanSlider.addEventListener('input', function(e) {
            updateFanSpeed(e.target.value);
        });
        console.log('✅ Fan slider configurado');
    }

    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function(e) {
            deviceStates.led.brightness = e.target.value;
            if (deviceStates.led.on && typeof sendToESP8266 === 'function') {
                sendToESP8266('led', deviceStates.led);
            }
        });
        console.log('✅ Brightness slider configurado');
    }

    // Inicializar valores padrão
    updateFanSpeed(0);
    
    // Definir cor inicial após um pequeno delay
    setTimeout(() => {
        setPresetColor('#ff0000');
    }, 200);
    
    // Testar conexão ESP8266 se disponível
    if (typeof testConnection === 'function') {
        setTimeout(testConnection, 1000);
    }
    
    console.log('✅ Controles da automação inicializados');
}

// Função para verificar se canvas foi desenhado
function checkCanvasDrawn() {
    if (!colorWheelCanvas || !colorWheelContext) return false;
    
    // Verificar se há pixels coloridos no canvas
    const imageData = colorWheelContext.getImageData(0, 0, colorWheelCanvas.width, colorWheelCanvas.height);
    const data = imageData.data;
    
    // Procurar por pixels não-transparentes
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { // Alpha > 0
            return true;
        }
    }
    return false;
}

// Fallback se canvas não funcionar
function enableFallbackColorWheel() {
    console.log('🔄 Ativando fallback do color wheel...');
    
    const canvas = document.getElementById('colorWheelCanvas');
    const fallback = document.getElementById('colorWheelFallback');
    
    if (canvas && fallback) {
        canvas.style.display = 'none';
        fallback.style.display = 'block';
        
        // Adicionar eventos ao fallback
        fallback.addEventListener('click', function(e) {
            const rect = fallback.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angle = Math.atan2(y - centerY, x - centerX);
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDistance = Math.min(rect.width, rect.height) / 2;
            
            if (distance <= maxDistance) {
                const hue = ((angle * 180 / Math.PI) + 360) % 360;
                const saturation = Math.min(distance / maxDistance * 100, 100);
                const rgb = hslToRgb(hue, saturation, 50);
                
                updateColorSelection(rgb.r, rgb.g, rgb.b, x, y);
            }
        });
        
        console.log('✅ Fallback ativado');
    }
}

// Controle do LED
function toggleLED() {
    const button = document.getElementById('ledToggle');
    deviceStates.led.on = !deviceStates.led.on;
    
    if (deviceStates.led.on) {
        button.textContent = 'Desligado';
        button.classList.remove('off');
    } else {
        button.textContent = 'Ligado';
        button.classList.add('off');
    }

    console.log('💡 LED:', deviceStates.led.on ? 'LIGADO' : 'DESLIGADO');
    
    if (typeof sendToESP8266 === 'function') {
        sendToESP8266('led', deviceStates.led);
    }
}

// Controle do computador
function toggleComputer() {
    const button = document.getElementById('computerToggle');
    deviceStates.computer.on = !deviceStates.computer.on;
    
    if (deviceStates.computer.on) {
        button.textContent = 'Desligado';
        button.classList.remove('off');
    } else {
        button.textContent = 'Ligado';
        button.classList.add('off');
    }

    console.log('💻 Computador:', deviceStates.computer.on ? 'LIGADO' : 'DESLIGADO');
    
    if (typeof sendToESP8266 === 'function') {
        sendToESP8266('computer', deviceStates.computer);
    }
}

// Atualizar velocidade do ventilador
function updateFanSpeed(value) {
    deviceStates.fan.speed = parseInt(value);
    
    const speedElement = document.getElementById('fanSpeedValue');
    const levelElement = document.getElementById('fanLevelText');
    
    if (speedElement) speedElement.textContent = deviceStates.fan.speed;
    
    let levelText = 'Desligado';
    if (deviceStates.fan.speed > 0 && deviceStates.fan.speed <= 25) levelText = 'Baixa';
    else if (deviceStates.fan.speed > 25 && deviceStates.fan.speed <= 50) levelText = 'Média';
    else if (deviceStates.fan.speed > 50 && deviceStates.fan.speed <= 75) levelText = 'Alta';
    else if (deviceStates.fan.speed > 75) levelText = 'Máxima';
    
    if (levelElement) levelElement.textContent = levelText;

    console.log('💨 Ventilador:', `${deviceStates.fan.speed}% (${levelText})`);
    
    if (typeof sendToESP8266 === 'function') {
        sendToESP8266('fan', deviceStates.fan);
    }
}

// Variáveis globais para o color wheel
let colorWheelCanvas;
let colorWheelContext;
let isDragging = false;
let selectedRGB = { r: 255, g: 0, b: 0 }; // Cor inicial (vermelho)

// Inicializar o color wheel canvas
function initializeColorWheel() {
    // Aguardar o DOM estar pronto
    setTimeout(() => {
        colorWheelCanvas = document.getElementById('colorWheelCanvas');
        if (!colorWheelCanvas) {
            console.error('❌ Canvas colorWheelCanvas não encontrado');
            return;
        }
        
        colorWheelContext = colorWheelCanvas.getContext('2d');
        if (!colorWheelContext) {
            console.error('❌ Não foi possível obter contexto 2D do canvas');
            return;
        }
        
        console.log('🎨 Inicializando color wheel canvas...');
        
        // Desenhar a roda de cores
        drawColorWheel();
        
        // Configurar eventos
        setupColorWheelEvents();
        
        // Posicionar seletor inicial (vermelho)
        setColorWheelPosition(255, 0, 0);
        
        console.log('✅ Color wheel inicializado com sucesso');
    }, 100);
}

// Desenhar a roda de cores (versão otimizada)
function drawColorWheel() {
    const canvas = colorWheelCanvas;
    const ctx = colorWheelContext;
    const size = canvas.width;
    const radius = size / 2;
    const centerX = radius;
    const centerY = radius;
    
    console.log('🖼️ Desenhando roda de cores...', { size, radius });
    
    // Limpar canvas
    ctx.clearRect(0, 0, size, size);
    
    // Criar ImageData para desenho pixel por pixel
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    let pixelsDrawn = 0;
    
    // Desenhar pixel por pixel
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Calcular distância do centro
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Se está dentro do círculo
            if (distance <= radius) {
                // Calcular ângulo (hue)
                let angle = Math.atan2(dy, dx);
                let hue = ((angle * 180 / Math.PI) + 360) % 360;
                
                // Calcular saturação baseada na distância
                const saturation = Math.min(distance / radius * 100, 100);
                
                // Valor fixo
                const value = 100;
                
                // Converter HSV para RGB
                const rgb = hsvToRgb(hue, saturation, value);
                
                // Definir pixel
                const index = (y * size + x) * 4;
                data[index] = rgb.r;     // Red
                data[index + 1] = rgb.g; // Green
                data[index + 2] = rgb.b; // Blue
                data[index + 3] = 255;   // Alpha
                
                pixelsDrawn++;
            } else {
                // Fora do círculo - transparente
                const index = (y * size + x) * 4;
                data[index + 3] = 0; // Alpha = 0 (transparente)
            }
        }
    }
    
    // Aplicar os dados ao canvas
    ctx.putImageData(imageData, 0, 0);
    
    console.log(`✅ Roda de cores desenhada: ${pixelsDrawn} pixels`);
}

// Conversão HSV para RGB (algoritmo do ESP8266)
function hsvToRgb(h, s, v) {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = (v / 100) - c;
    
    let r, g, b;
    
    if (h >= 0 && h < 60) { [r, g, b] = [c, x, 0]; }
    else if (h >= 60 && h < 120) { [r, g, b] = [x, c, 0]; }
    else if (h >= 120 && h < 180) { [r, g, b] = [0, c, x]; }
    else if (h >= 180 && h < 240) { [r, g, b] = [0, x, c]; }
    else if (h >= 240 && h < 300) { [r, g, b] = [x, 0, c]; }
    else { [r, g, b] = [c, 0, x]; }
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

// Configurar eventos do color wheel
function setupColorWheelEvents() {
    // Eventos de mouse
    colorWheelCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleColorWheelEvent(e);
        colorWheelCanvas.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleColorWheelEvent(e);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            colorWheelCanvas.style.cursor = 'pointer';
        }
    });
    
    // Eventos de touch para mobile
    colorWheelCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDragging = true;
        handleColorWheelEvent(e);
    });
    
    colorWheelCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDragging) {
            handleColorWheelEvent(e);
        }
    });
    
    colorWheelCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
    });
}

// Manipular eventos do color wheel
function handleColorWheelEvent(event) {
    event.preventDefault();

    const rect = colorWheelCanvas.getBoundingClientRect();

    // Detecta se é touch ou mouse
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    // Calcula coordenadas relativas ao canvas visual
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Ajusta para resolução real do canvas
    const scaleX = colorWheelCanvas.width / rect.width;
    const scaleY = colorWheelCanvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    // Verifica se está dentro do círculo
    const centerX = colorWheelCanvas.width / 2;
    const centerY = colorWheelCanvas.height / 2;
    const distance = Math.sqrt((canvasX - centerX) ** 2 + (canvasY - centerY) ** 2);

    if (
        distance <= centerX &&
        canvasX >= 0 && canvasX <= colorWheelCanvas.width &&
        canvasY >= 0 && canvasY <= colorWheelCanvas.height
    ) {
        // Obter cor do pixel
        const imageData = colorWheelContext.getImageData(canvasX, canvasY, 1, 1).data;

        if (imageData[3] > 0) { // Alpha > 0, está dentro do círculo
            const r = imageData[0];
            const g = imageData[1];
            const b = imageData[2];

            // Atualizar cor selecionada
            selectedRGB = { r, g, b };
            // Passa as coordenadas DOM (x, y) para posicionar o seletor corretamente
            updateColorSelection(r, g, b, x, y);
        }
    }
}

function resizeColorWheel() {
    const container = document.querySelector(".color-wheel-container");
    if (!container || !colorWheelCanvas) return;

    const size = Math.min(container.offsetWidth, container.offsetHeight);
    colorWheelCanvas.width = size;
    colorWheelCanvas.height = size;

    drawColorWheel();
    setColorWheelPosition(selectedRGB.r, selectedRGB.g, selectedRGB.b);
}

window.addEventListener("resize", resizeColorWheel);


// Atualizar seleção de cor
function updateColorSelection(r, g, b, x, y) {
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hex = rgbToHex(r, g, b);

    // Posicionar o seletor
    const selector = document.getElementById('colorSelector');
    if (selector) {
        selector.style.left = x + 'px';
        selector.style.top = y + 'px';
        selector.style.backgroundColor = rgb;

        // Ajustar cor da borda para melhor visibilidade
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        selector.style.borderColor = brightness > 128 ? '#333' : 'white';
    }

    // Atualizar estado
    deviceStates.led.color = hex;

    // Atualizar exibição da cor escolhida
    const colorBox = document.getElementById('selectedColorBox');
    const colorHex = document.getElementById('selectedColorHex');
    if (colorBox) colorBox.style.background = hex;
    if (colorHex) colorHex.textContent = hex;

    console.log('🎨 Cor selecionada:', rgb, '→', hex);

    // Enviar para ESP8266 se LED estiver ligado
    if (deviceStates.led.on && typeof sendToESP8266 === 'function') {
        sendToESP8266('led', {
            ...deviceStates.led,
            rgb: { r, g, b }
        });
    }
}

// Converter RGB para HEX
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Definir posição do color wheel por RGB
function setColorWheelPosition(r, g, b) {
    const rgb = { r, g, b };
    const hsv = rgbToHsv(r, g, b);

    // Calcular posição na roda
    const radius = colorWheelCanvas.width / 2;
    const angle = (hsv.h * Math.PI) / 180;
    const distance = (hsv.s / 100) * (radius - 10);

    const x = radius + Math.cos(angle) * distance;
    const y = radius + Math.sin(angle) * distance;

    // Converter para coordenadas do DOM
    const rect = colorWheelCanvas.getBoundingClientRect();
    const domX = (x / colorWheelCanvas.width) * rect.width;
    const domY = (y / colorWheelCanvas.height) * rect.height;

    updateColorSelection(r, g, b, domX, domY);
}

// Converter RGB para HSV
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    if (diff !== 0) {
        switch (max) {
            case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / diff + 2) / 6; break;
            case b: h = ((r - g) / diff + 4) / 6; break;
        }
    }
    
    return {
        h: h * 360,
        s: s * 100,
        v: v * 100
    };
}

// Cores predefinidas com RGB preciso
function setPresetColor(color) {
    const rgb = hexToRgb(color);
    if (rgb) {
        selectedRGB = rgb;
        setColorWheelPosition(rgb.r, rgb.g, rgb.b);
        deviceStates.led.color = color;
        
        console.log('🎨 Cor predefinida:', color, '→ RGB:', rgb);
        
        if (deviceStates.led.on && typeof sendToESP8266 === 'function') {
            sendToESP8266('led', {
                ...deviceStates.led,
                rgb: rgb
            });
        }
    }
}

// Converter HEX para RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Versão simplificada das antigas funções para compatibilidade
function selectColor(event) {
    // Esta função agora é tratada pelos event listeners do canvas
    console.log('⚠️ selectColor() chamada - usando novo sistema de canvas');
}

// Remover funções antigas de HSL
function setColorByHSL(hue, saturation = 100, lightness = 50) {
    // Converter HSL para RGB e usar o novo sistema
    const rgb = hslToRgb(hue, saturation, lightness);
    setColorWheelPosition(rgb.r, rgb.g, rgb.b);
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    
    if (h < 1/6) [r, g, b] = [c, x, 0];
    else if (h < 2/6) [r, g, b] = [x, c, 0];
    else if (h < 3/6) [r, g, b] = [0, c, x];
    else if (h < 4/6) [r, g, b] = [0, x, c];
    else if (h < 5/6) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}