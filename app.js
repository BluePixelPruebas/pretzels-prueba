const app = {
    state: {
        orderType: 'pickup',
        store: null,
        cartTotal: 0,
        menuItems: [],
        customPretzel: {
            active: false,
            price: 65.00,
            toppings: [],
            dips: [],
            drink: false
        },
        coupon: null,
        jalapenoStock: 2
    },

    log: function(message, type = 'system') {
        const consoleEl = document.getElementById('console-output');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const d = new Date();
        const time = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
        
        entry.textContent = `[${time}] ${message}`;
        consoleEl.appendChild(entry);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    },

    track: function(eventName, data = {}) {
        if (window.dataLayer) {
            window.dataLayer.push({ event: eventName, ...data });
        }
        this.log(`[Mixpanel Telemetry] Evento: ${eventName}`, 'ui');
    },

    initSplash: function() {
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => { splash.style.display = 'none'; }, 500);
            }
        }, 1500);
    },
    
    triggerDynamicIsland: function(message, duration = 3000) {
        const island = document.getElementById('dynamic-island');
        const content = document.getElementById('dynamic-island-content');
        if (!island || !content) return;
        
        // Expand
        island.style.width = '240px';
        island.style.height = '40px';
        island.style.borderRadius = '20px';
        
        setTimeout(() => {
            content.innerText = message;
            content.style.opacity = '1';
            
            if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
            
            // Retract
            setTimeout(() => {
                content.style.opacity = '0';
                setTimeout(() => {
                    island.style.width = '120px';
                    island.style.height = '32px';
                    content.innerText = '';
                }, 200);
            }, duration);
            
        }, 300);
    },

    showStep: function(stepId) {
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.scrollTop = 0;
        }

        document.querySelectorAll('.step-container').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        const nextStep = document.getElementById(`step-${stepId}`);
        nextStep.classList.remove('hidden');
        void nextStep.offsetWidth; // Force reflow
        nextStep.classList.add('active');
        
        // Update Bottom Nav active state
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = (stepId === 'login') ? 'none' : 'flex';
        }

        const navItems = document.querySelectorAll('.nav-item');
        if (navItems.length > 0) {
            if (stepId === 'home' || stepId === 'stores') {
                navItems.forEach(n => n.classList.remove('active'));
                navItems[0].classList.add('active');
            } else if (stepId === 'orders' || stepId === 'order-details') {
                navItems.forEach(n => n.classList.remove('active'));
                navItems[1].classList.add('active');
            } else if (stepId === 'menu') {
                navItems.forEach(n => n.classList.remove('active'));
                navItems[3].classList.add('active');
            }
        }

        // Hide sticky cart in specific steps where it overlaps or is redundant
        const stickyCart = document.getElementById('sticky-cart-btn');
        if (stickyCart) {
            const hiddenSteps = ['checkout', 'login', 'order-success', 'orders', 'order-details', 'delivery'];
            if (hiddenSteps.includes(stepId)) {
                stickyCart.style.display = 'none';
            } else {
                stickyCart.style.display = '';
            }
        }
        
        // Check if cart has items to show floating button
        const headerCartBtn = document.getElementById('header-cart-btn');
        if (headerCartBtn && (stepId === 'home' || stepId === 'menu' || stepId === 'stores' || stepId === 'rewards')) {
            if (this.state.menuItems.length > 0 || this.state.customPretzel.active) {
                headerCartBtn.classList.remove('hidden');
            } else {
                headerCartBtn.classList.add('hidden');
            }
        } else if (headerCartBtn) {
            headerCartBtn.classList.add('hidden');
        }
    },

    toggleSideMenu: function() {
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu.classList.contains('hidden')) {
            sideMenu.classList.remove('hidden');
        } else {
            sideMenu.classList.add('hidden');
        }
    },

    showRewards: function() {
        this.log('[Loyalty Service] Recuperando balance y token dinámico (QR)...', 'api');
        this.track('view_rewards');
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.nav-item')[2].classList.add('active');
        
        setTimeout(() => {
            this.showStep('rewards');
            this.log('Balance actualizado: 1,250 pts.', 'system');
        }, 400);
    },

    setOrderType: function(type, element) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        element.classList.add('active');
        this.state.orderType = type;
        
        if (type === 'pickup') {
            document.getElementById('pickup-view').classList.remove('hidden');
            document.getElementById('delivery-view').classList.add('hidden');
        } else {
            document.getElementById('pickup-view').classList.add('hidden');
            document.getElementById('delivery-view').classList.remove('hidden');
        }

        this.log(`Modo de orden actualizado a: ${type.toUpperCase()}`, 'ui');
        if (type === 'delivery') {
            this.log('[Location API] Calculando costo dinámico de envío basado en geocercas...', 'api');
        }
    },

    login: function() {
        this.log('Iniciando flujo OAuth 2.0 (Identity Provider)...', 'auth');
        this.track('user_login', { method: 'Google' });
        setTimeout(() => {
            this.log('Token JWT validado. Recuperando perfil del usuario...', 'auth');
            this.log('[Loyalty Engine] Consultando balance de puntos...', 'api');
            setTimeout(() => {
                this.log('Balance: 1,250 pts. Nivel: Gold.', 'system');
                
                // EVENTO GA4: Inicio de Sesión
                window.dataLayer.push({
                    event: 'login',
                    method: 'Google',
                    user_tier: 'Gold',
                    loyalty_points: 1250
                });

                this.showStep('stores');
            }, 800);
        }, 1000);
    },

    loginEmail: function() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        if(!email || !pass) {
            alert('Por favor ingresa tu correo y contraseña');
            return;
        }

        this.log(`Autenticando usuario: ${email} vía [Auth Provider]...`, 'auth');
        this.track('user_login', { method: 'Email' });
        setTimeout(() => {
            this.log('Credenciales válidas. Token JWT generado.', 'auth');
            this.log('[Loyalty Engine] Consultando balance de puntos...', 'api');
            setTimeout(() => {
                this.log('Balance: 1,250 pts. Nivel: Gold.', 'system');
                
                // EVENTO GA4: Inicio de Sesión
                if (window.dataLayer) {
                    window.dataLayer.push({
                        event: 'login',
                        method: 'Email',
                        user_tier: 'Gold',
                        loyalty_points: 1250
                    });
                }

                this.showStep('stores');
            }, 800);
        }, 1000);
    },

    selectStore: function(storeName) {
        this.log(`[Inventory Service] Solicitando lock de inventario en sucursal: ${storeName}`, 'api');
        setTimeout(() => {
            this.log('Lock exitoso. Sesión de carrito iniciada (TTL: 15min).', 'system');
            this.state.store = storeName;
            
            const storeDisplay = document.getElementById('current-store-display');
            const headerLabel = document.getElementById('header-order-label');
            const headerIcon = document.getElementById('header-order-icon');
            
            if (storeDisplay) {
                if (storeName.includes('Delivery')) {
                    storeDisplay.textContent = 'Av. Palmas 405...';
                    if (headerLabel) headerLabel.textContent = 'Entregando en';
                    if (headerIcon) headerIcon.textContent = 'moped';
                } else {
                    storeDisplay.textContent = `Wetzel's ${storeName}`;
                    if (headerLabel) headerLabel.textContent = 'Recoger en';
                    if (headerIcon) headerIcon.textContent = 'storefront';
                }
            }
            
            this.showStep('home');
        }, 600);
    },

    // ---------- MENU LOGIC ----------

    filterMenu: function(category, btnElement) {
        // Update pills active state
        document.querySelectorAll('#menu-pills .pill').forEach(el => el.classList.remove('selected'));
        if (btnElement) btnElement.classList.add('selected');

        // Hide/show category headers and their adjacent grids
        const categories = ['pretzels', 'bitz', 'dogs', 'bebidas'];
        categories.forEach(cat => {
            const header = document.getElementById(`cat-${cat}`);
            if (header) {
                const grid = header.nextElementSibling;
                if (category === 'todos' || category === cat) {
                    header.classList.remove('hidden');
                    if (grid && grid.classList.contains('full-menu-grid')) {
                        grid.classList.remove('hidden');
                    }
                } else {
                    header.classList.add('hidden');
                    if (grid && grid.classList.contains('full-menu-grid')) {
                        grid.classList.add('hidden');
                    }
                }
            }
        });
        
        // Ensure scroll is reset to top of menu
        document.getElementById('app-content').scrollTo({ top: 0, behavior: 'smooth' });
    },

    addMenuItem: function(name, price, emoji) {
        // 📦 FEATURE 3: ERP Inventory Tracker
        if (name.includes('Jalape') && name.includes('Cheese')) {
            if (this.state.jalapenoStock <= 0) {
                this.showOutOfStockOptions(name, price, emoji);
                return;
            }
            this.state.jalapenoStock--;
            this.log(`[ERP API] Descontando 1 ${name} del inventario SAP (Sucursal). Inventario crítico: ${this.state.jalapenoStock} restante.`, 'api');
            
            const badge = document.getElementById('jalapeno-badge');
            const dashStatus = document.getElementById('jalapeno-stock-status');
            
            if (this.state.jalapenoStock === 1) {
                if (badge) badge.textContent = 'Solo queda 1';
                if (dashStatus) dashStatus.innerHTML = '⚠️ STOCK CRÍTICO (Queda 1)';
            } else if (this.state.jalapenoStock === 0) {
                if (badge) {
                    badge.textContent = 'Agotado';
                    badge.style.background = '#ef4444';
                    badge.style.color = 'white';
                }
                if (dashStatus) dashStatus.innerHTML = '❌ AGOTADO';
                
                const cards = document.querySelectorAll('.menu-card');
                cards.forEach(card => {
                    if (card.querySelector('h4') && card.querySelector('h4').textContent.includes('Jalape') && card.querySelector('h4').textContent.includes('Cheese')) {
                        card.style.opacity = '0.5';
                    }
                });
            }
        }

        this.state.menuItems.push({ name, price, emoji });
        this.updateCartTotal();
        this.track('add_to_cart', { item: name, price: price });
        this.log(`Agregado al carrito: ${name} ($${price.toFixed(2)})`, 'ui');
        
        // EVENTO GA4: Agregar al Carrito (Items del Menú)
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'add_to_cart',
                ecommerce: { currency: 'MXN', value: price, items: [{ item_name: name, price: price, quantity: 1 }] }
            });
        }
        
        // 🌟 FEATURE 2: Micro-interacciones (Haptics y Animación)
        if (navigator.vibrate) navigator.vibrate([15, 30, 15]); // Doble tap Haptic feedback
        
        const cartBtn = document.getElementById('header-cart-btn');
        cartBtn.classList.remove('hidden');
        cartBtn.classList.remove('bounce'); // Reset
        void cartBtn.offsetWidth; // Trigger reflow
        cartBtn.classList.add('bounce');
        
        // 🚀 MICRO-INTERACCIÓN: Emoji Volador
        const e = window.event;
        if (e && e.clientX) {
            const flyingEmoji = document.createElement('div');
            flyingEmoji.textContent = emoji;
            flyingEmoji.style.position = 'fixed';
            flyingEmoji.style.left = `${e.clientX}px`;
            flyingEmoji.style.top = `${e.clientY}px`;
            flyingEmoji.style.fontSize = '2rem';
            flyingEmoji.style.zIndex = 9999;
            flyingEmoji.style.pointerEvents = 'none';
            flyingEmoji.style.transition = 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            document.body.appendChild(flyingEmoji);

            const cartRect = cartBtn.getBoundingClientRect();
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    flyingEmoji.style.left = `${cartRect.left + (cartRect.width / 2)}px`;
                    flyingEmoji.style.top = `${cartRect.top + (cartRect.height / 2)}px`;
                    flyingEmoji.style.transform = 'scale(0.1)';
                    flyingEmoji.style.opacity = '0';
                });
            });

            setTimeout(() => flyingEmoji.remove(), 600);
        }
        
        // 🌟 FEATURE 1: Smart Upsell (AI-Powered)
        // No mostrar upsells si agregaron una bebida o dip, o si ya se mostró recientemente
        if (!this.state.upsellShown && name !== 'Fresh Lemonade' && !name.toLowerCase().includes('dip') && !name.toLowerCase().includes('bitz')) {
            this.showSmartUpsell(name);
        }
    },

    showSmartUpsell: function(baseProductName) {
        this.state.upsellShown = true;
        this.log(`[AI Engine] Analizando canasta... Recomendando "Cheddar Dip" para: ${baseProductName}`, 'api');
        
        const upsellDiv = document.createElement('div');
        upsellDiv.className = 'smart-upsell-toast';
        upsellDiv.innerHTML = `
            <div class="upsell-content">
                <div class="upsell-icon">🧀</div>
                <div class="upsell-text">
                    <h4>¡Combina genial con tu ${baseProductName}!</h4>
                    <p>Agrega un Dip de Queso Cheddar por $15.00</p>
                </div>
            </div>
            <div class="upsell-actions">
                <button class="btn-text" onclick="this.closest('.smart-upsell-toast').remove()" style="color: rgba(255,255,255,0.7); font-size: 0.8rem;">No, gracias</button>
                <button class="btn-primary-small" onclick="app.addMenuItem('Cheddar Dip', 15.00, '🧀'); this.closest('.smart-upsell-toast').remove()">Agregar +$15</button>
            </div>
        `;
        document.querySelector('.device-frame').appendChild(upsellDiv);
        
        // Auto remove after 6 seconds
        setTimeout(() => { if(upsellDiv.parentElement) upsellDiv.remove(); }, 6000);
    },

    showOutOfStockOptions: function(name, price, emoji) {
        this.log(`[AI Orchestrator] Calculando rutas de contingencia para producto agotado (${name})...`, 'api');
        
        const upsellDiv = document.createElement('div');
        upsellDiv.className = 'smart-upsell-toast';
        upsellDiv.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)'; // Tema oscuro para contraste
        upsellDiv.style.border = '1px solid rgba(255,255,255,0.1)';
        
        if (this.state.orderType === 'delivery') {
            upsellDiv.innerHTML = `
                <div class="upsell-content">
                    <div class="upsell-icon" style="font-size: 2rem;">🛵</div>
                    <div class="upsell-text">
                        <h4 style="color: white;">Agotado en tu sucursal más cercana</h4>
                        <p style="color: #cbd5e1;">Podemos enviarlo desde Mítikah, pero tomará 15 minutos extra. ¿Deseas continuar?</p>
                    </div>
                </div>
                <div class="upsell-actions" style="flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.8rem; margin-top: 0.5rem;">
                    <button class="btn-primary-small" style="width: 100%; justify-content: center; background: #10b981;" onclick="app.changeStoreAndAdd('Mítikah', '${name}', ${price}, '${emoji}'); this.closest('.smart-upsell-toast').remove()">Aceptar tiempo extra y continuar</button>
                    <button class="btn-text" style="width: 100%; color: rgba(255,255,255,0.7);" onclick="this.closest('.smart-upsell-toast').remove()">Cancelar</button>
                </div>
            `;
        } else {
            upsellDiv.innerHTML = `
                <div class="upsell-content" style="align-items: flex-start;">
                    <div class="upsell-icon" style="font-size: 2rem;">🚫</div>
                    <div class="upsell-text">
                        <h4 style="color: white; line-height: 1.2;">Se nos acabó el ${name} por hoy</h4>
                        <p style="color: #cbd5e1; font-size: 0.8rem;">Pero el horno nos avisa que estas opciones recién salieron. ¿Cómo lo resolvemos?</p>
                    </div>
                </div>
                <div class="upsell-actions" style="flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.8rem; margin-top: 0.5rem; display: flex;">
                    <button class="btn-primary-small" style="width: 100%; justify-content: flex-start; text-align: left; padding: 0.6rem; background: rgba(255,255,255,0.1); color: white;" onclick="app.addMenuItem('Pepperoni Twist', 85.00, '🍕'); this.closest('.smart-upsell-toast').remove()"><span style="margin-right:0.5rem;">🍕</span> Cambiar por Pepperoni Twist</button>
                    <button class="btn-primary-small" style="width: 100%; justify-content: flex-start; text-align: left; padding: 0.6rem; background: rgba(255,255,255,0.1); color: white;" onclick="app.triggerDynamicIsland('Notificación Activa 🔔', 2500); this.closest('.smart-upsell-toast').remove()"><span style="margin-right:0.5rem;">🕒</span> Avisarme cuando salgan (20m)</button>
                    <button class="btn-text" style="width: 100%; justify-content: flex-start; text-align: left; padding: 0.6rem; color: #10b981;" onclick="app.showStep('stores'); this.closest('.smart-upsell-toast').remove()"><span class="material-symbols-rounded" style="font-size: 1.2rem; margin-right: 0.5rem; vertical-align: middle;">location_on</span> Buscar en otras sucursales</button>
                </div>
            `;
        }
        
        document.querySelector('.device-frame').appendChild(upsellDiv);
    },

    changeStoreAndAdd: function(newStore, name, price, emoji) {
        this.log(`[Order Router] Redirigiendo orden a sucursal contingencia: ${newStore}...`, 'system');
        this.state.store = newStore;
        
        // Simular que en la nueva sucursal si hay stock suficiente
        this.state.jalapenoStock = 5; 
        
        // Agregar el item
        this.addMenuItem(name, price, emoji);
        this.triggerDynamicIsland("Sucursal cambiada ✅", 2500);
    },

    // ---------- NEW FUTUREPROOF FEATURES ----------
    
    toggleGodMode: function() {
        const appContent = document.getElementById('app-content');
        const dashboardContent = document.getElementById('dashboard-content');
        const bottomNav = document.querySelector('.bottom-nav');
        
        if (appContent.classList.contains('hidden')) {
            appContent.classList.remove('hidden');
            dashboardContent.classList.add('hidden');
            bottomNav.style.display = 'flex';
            this.log('[System] Saliendo de God Mode. Interfaz de usuario restaurada.', 'system');
        } else {
            appContent.classList.add('hidden');
            dashboardContent.classList.remove('hidden');
            bottomNav.style.display = 'none';
            this.log('[System] Activando God Mode. Extrayendo telemetría directiva de Mixpanel en tiempo real...', 'system');
        }
    },
    
    triggerERPOrder: function(btnElement) {
        this.log(`[ERP Automation] Generando orden de abastecimiento automática a proveedor central por Jalapeño Cheese...`, 'api');
        
        btnElement.innerHTML = 'Enviando...';
        btnElement.style.opacity = '0.7';
        
        setTimeout(() => {
            btnElement.innerHTML = '✅ Orden #4092 Enviada al CEDIS';
            btnElement.style.background = '#10b981';
            btnElement.style.opacity = '1';
            btnElement.disabled = true;
            this.log(`[ERP Automation] Orden de compra confirmada. Entrega estimada en Sucursal: Mañana 06:00 AM.`, 'system');
            this.triggerDynamicIsland("ERP: Orden Enviada ✅", 3000);
        }, 1500);
    },

    sendAgentMessage: function() {
        const inputEl = document.getElementById('agent-input');
        const msg = inputEl.value.trim();
        if(!msg) return;
        
        const chatBox = document.getElementById('agent-messages');
        
        // Agregar mensaje del usuario
        chatBox.innerHTML += `<div class="msg user">${msg}</div>`;
        inputEl.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;
        
        this.log('[Agent Orchestrator] Analizando intención del usuario mediante NLP...', 'api');
        
        // Simular respuesta inteligente del agente
        setTimeout(() => {
            this.log('[Agent Orchestrator] Intención detectada: "Modificación logística". Enviando instrucción a API de Kitchen System.', 'api');
            chatBox.innerHTML += `<div class="msg bot" style="animation: slideUp 0.3s ease;">Entendido. He sincronizado esta instrucción directamente con el horno inteligente de la sucursal para garantizar que tu pedido sea perfecto. 🥨🤖</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1500);
    },

    // ---------- PRETZEL MAKER LOGIC ----------

    startCreatePretzel: function() {
        this.log('[Strapi CMS] Solicitando configuraciones permitidas para "Custom Pretzel"...', 'api');
        setTimeout(() => {
            this.log('Reglas de negocio cargadas: Prevención de mezcla Dulce/Salado.', 'system');
            this.showStep('create');
        }, 400);
    },

    toggleOption: function(element, type, name, emoji) {
        const isSelected = element.classList.contains('selected');
        let cp = this.state.customPretzel;
        
        // Define sweet and salty categories based on PRD rules
        const sweetToppings = ['Canela'];
        const saltyToppings = ['Sal', 'Pepperoni', 'Jalapeño', 'Queso'];
        
        if (type === 'topping') {
            if (!isSelected) {
                if (cp.toppings.length >= 3) {
                    this.log('[Validation Error] El usuario intentó agregar >3 toppings.', 'ui');
                    alert('Puedes elegir máximo 3 toppings.');
                    return;
                }
                
                // PRD Business Rule: Validate sweet vs salty compatibility
                const isAddingSweet = sweetToppings.includes(name);
                const isAddingSalty = saltyToppings.includes(name);
                const hasSweet = cp.toppings.some(t => sweetToppings.includes(t.name));
                const hasSalty = cp.toppings.some(t => saltyToppings.includes(t.name));
                
                if ((isAddingSweet && hasSalty) || (isAddingSalty && hasSweet)) {
                    this.log(`[Rules Engine] Bloqueo de compatibilidad: Mezcla de Dulce y Salado no permitida.`, 'system');
                    alert('Por regla del menú, no puedes mezclar ingredientes dulces con salados.');
                    return;
                }
            }
            
            if (isSelected) {
                cp.toppings = cp.toppings.filter(t => t.name !== name);
                cp.price -= 10;
                this.log(`Remove Topping: ${name} (-$10.00)`, 'ui');
            } else {
                cp.toppings.push({name, emoji});
                cp.price += 10;
                this.log(`Add Topping: ${name} (+$10.00)`, 'ui');
            }
        } else {
            if (isSelected) {
                cp.dips = cp.dips.filter(d => d.name !== name);
                cp.price -= 15;
                this.log(`Remove Dip: ${name} (-$15.00)`, 'ui');
            } else {
                cp.dips.push({name, emoji});
                cp.price += 15;
                this.log(`Add Dip: ${name} (+$15.00)`, 'ui');
            }
        }

        element.classList.toggle('selected');
        this.updateVisualPretzel();
        document.getElementById('maker-price').textContent = cp.price.toFixed(2);
    },

    toggleDrink: function(element) {
        let cp = this.state.customPretzel;
        if (element.checked) {
            cp.drink = true;
            cp.price += 40;
            this.log('Upsell aceptado: Agregando Bebida (+$40.00)', 'ui');
        } else {
            cp.drink = false;
            cp.price -= 40;
            this.log('Bebida removida (-$40.00)', 'ui');
        }
        document.getElementById('maker-price').textContent = cp.price.toFixed(2);
    },

    updateVisualPretzel: function() {
        const visual = document.getElementById('pretzel-visual');
        const desc = document.getElementById('preview-desc');
        const cp = this.state.customPretzel;
        
        if (cp.toppings.length === 0) {
            visual.innerHTML = '🥨';
            desc.textContent = 'Base horneada con mantequilla.';
            visual.style.transform = 'scale(1) rotate(0deg)';
        } else {
            const emojis = cp.toppings.map(t => `<span style="font-size: 2.5rem; margin: 0 5px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));">${t.emoji}</span>`).join('');
            visual.innerHTML = `<div style="line-height: 1;">🥨</div><div style="display: flex; justify-content: center; flex-wrap: wrap; margin-top: -5px;">${emojis}</div>`;
            desc.textContent = `Pretzel con ${cp.toppings.map(t=>t.name).join(', ')}`;
            visual.style.transform = 'scale(1.05) rotate(2deg)';
            setTimeout(() => visual.style.transform = 'scale(1) rotate(0deg)', 200);
        }
    },

    finishPretzelMaker: function() {
        this.state.customPretzel.active = true;
        this.updateCartTotal();
        this.track('add_to_cart', { item: 'Custom Pretzel', price: this.state.customPretzel.price });
        this.log(`Pretzel Maker guardado en Carrito. Subtotal Maker: $${this.state.customPretzel.price.toFixed(2)}`, 'system');
        this.goToCheckout();
    },

    // ---------- CART & CHECKOUT ----------

    updateCartTotal: function() {
        let total = 0;
        this.state.menuItems.forEach(item => {
            total += item.price;
        });
        if (this.state.customPretzel.active) {
            total += this.state.customPretzel.price;
        }
        this.state.cartTotal = total;
        document.getElementById('cart-total-header').textContent = `$${total.toFixed(2)}`;
        document.getElementById('sticky-cart-total').textContent = `${total.toFixed(2)}`;

        const appContent = document.getElementById('app-content');
        if (appContent) {
            if (total > 0) {
                appContent.classList.add('has-cart');
            } else {
                appContent.classList.remove('has-cart');
            }
        }
        
        const hiddenSteps = ['step-checkout', 'step-login', 'step-order-success', 'step-orders', 'step-order-details', 'step-delivery'];
        let isHiddenStepActive = false;
        let activeStepId = '';
        
        document.querySelectorAll('.step-container').forEach(el => {
            if (!el.classList.contains('hidden')) {
                activeStepId = el.id.replace('step-', '');
                if (hiddenSteps.includes(el.id)) {
                    isHiddenStepActive = true;
                }
            }
        });

        // Header Cart Logic
        const headerCartBtn = document.getElementById('header-cart-btn');
        if (headerCartBtn && (activeStepId === 'home' || activeStepId === 'menu' || activeStepId === 'stores' || activeStepId === 'rewards')) {
            if (total > 0) {
                headerCartBtn.classList.remove('hidden');
            } else {
                headerCartBtn.classList.add('hidden');
            }
        } else if (headerCartBtn) {
            headerCartBtn.classList.add('hidden');
        }

        // Sticky Bottom Button Logic
        const stickyBtn = document.getElementById('sticky-cart-btn');
        const stickyTotal = document.getElementById('sticky-cart-total');
        if (stickyBtn && stickyTotal) {
            if (total > 0 && !isHiddenStepActive) {
                stickyTotal.textContent = total.toFixed(2);
                stickyBtn.classList.remove('hidden');
                stickyBtn.style.opacity = '1';
                stickyBtn.style.pointerEvents = 'all';
                stickyBtn.style.transform = 'translateX(-50%) translateY(0)';
            } else {
                stickyBtn.style.opacity = '0';
                stickyBtn.style.pointerEvents = 'none';
                stickyBtn.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => stickyBtn.classList.add('hidden'), 400);
            }
        }
    },

    goToCheckout: function() {
        this.updateCartTotal();
        
        this.log('[Pricing Engine] Calculando carrito con impuestos...', 'api');
        const summaryEl = document.getElementById('order-summary');
        
        let html = '';
        
        if (this.state.cartTotal === 0) {
            html += `<div class="summary-item" style="text-align: center; padding: 3rem 0; color: #64748B; justify-content: center; flex-direction: column; gap: 0.5rem; border: none;">
                        <span class="material-symbols-rounded" style="font-size: 3rem; color: #CBD5E1;">shopping_cart</span>
                        <span>Tu carrito está vacío</span>
                     </div>`;
        } else {
            // 1. Render Menu Items
            this.state.menuItems.forEach((item, index) => {
                html += `<div class="summary-item"><strong>${item.emoji} ${item.name}</strong> <span>$${item.price.toFixed(2)}</span></div>`;
            });

            // 2. Render Custom Pretzel (if built)
            if (this.state.customPretzel.active) {
                const cp = this.state.customPretzel;
                html += `<div class="summary-item mt-2"><strong>✨ Pretzel a tu manera</strong> <span>$65.00</span></div>`;
                
                cp.toppings.forEach(t => {
                    html += `<div class="summary-item text-muted" style="margin-left: 1rem; font-size: 0.85rem;"> + ${t.name} <span>$10.00</span></div>`;
                });
                cp.dips.forEach(d => {
                    html += `<div class="summary-item text-muted" style="margin-left: 1rem; font-size: 0.85rem;"> + ${d.name} Dip <span>$15.00</span></div>`;
                });
                if (cp.drink) {
                    html += `<div class="summary-item text-muted" style="margin-left: 1rem; font-size: 0.85rem;"> + Limonada Fresca <span>$40.00</span></div>`;
                }
            }
        }
        
        // 3. Delivery Fee
        let finalTotal = this.state.cartTotal;
        if (this.state.cartTotal > 0 && this.state.orderType === 'delivery') {
            html += `<div class="summary-item text-blue mt-2"><strong>Envío (Delivery)</strong> <span>$35.00</span></div>`;
            finalTotal += 35;
        }

        if (this.state.coupon === 'WETZELS20' && this.state.cartTotal > 0) {
            let discount = finalTotal * 0.20;
            html += `<div class="summary-item text-green mt-2" style="color: #10b981;"><strong>Descuento (WETZELS20)</strong> <span style="color: #10b981;">-$${discount.toFixed(2)}</span></div>`;
            finalTotal -= discount;
        }
        
        html += `<div class="summary-item total"><strong>Total a Pagar</strong> <strong id="final-price-text">$${finalTotal.toFixed(2)}</strong></div>`;
        summaryEl.innerHTML = html;
        document.getElementById('checkout-total').textContent = finalTotal.toFixed(2);
        
        // Update Bottom Nav active state
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        this.showStep('checkout');
    },

    applyCoupon: function(btnElement) {
        if (this.state.coupon) {
            this.triggerDynamicIsland("Cupón ya aplicado", 2000);
            return;
        }
        
        this.log('[Promo Engine] Validando elegibilidad de usuario para campaña de adquisición...', 'api');
        
        setTimeout(() => {
            this.state.coupon = 'WETZELS20';
            this.triggerDynamicIsland("20% Aplicado ✨", 2500);
            this.goToCheckout();
            
            if(btnElement) {
                btnElement.textContent = 'Aplicado ✅';
                btnElement.style.opacity = '0.5';
                btnElement.disabled = true;
            }
            
            this.track('apply_coupon', { code: 'WETZELS20' });
            this.log('[Promo Engine] Descuento del 20% aplicado exitosamente. Recalculando ticket...', 'system');
        }, 800);
    },
    
    addUpsellDip: function(btnElement, price) {
        this.log(`[AI Recommendation] Usuario aceptó upsell de Cheddar Dip (+$${price}). Actualizando ticket...`, 'api');
        
        this.state.cartTotal += price;
        this.goToCheckout();
        
        if (btnElement) {
            btnElement.innerHTML = 'Agregado';
            btnElement.style.background = '#3b82f6';
            btnElement.style.color = 'white';
            btnElement.style.padding = '0.4rem 0.6rem';
            btnElement.disabled = true;
        }
        
        this.triggerDynamicIsland("Dip Agregado 🧀", 2000);
        
        // Update dashboard metric for average ticket
        const avgEl = document.getElementById('dashboard-ticket-avg');
        if (avgEl) {
            let current = parseInt(avgEl.textContent.replace('$','')) || 180;
            avgEl.innerHTML = `$${current + 15} <span style="font-size:0.6rem; color:#10b981;">+Upsell</span>`;
        }
    },

    redeemReward: function(element, itemName, points) {
        // Change button state to indicate QR is available
        element.style.background = '#10b981';
        element.style.boxShadow = 'none';
        element.innerHTML = 'Ver QR';
        
        // Update and show QR modal
        document.getElementById('qr-modal-item').textContent = itemName;
        const modal = document.getElementById('qr-modal');
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';
        
        this.log(`[Loyalty API] QR de sucursal generado: ${itemName} (-${points} pts)`, 'api');
    },

    closeQrModal: function() {
        const modal = document.getElementById('qr-modal');
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
    },


    placeOrder: function() {
        // Feature 5: Face ID Security Simulation
        const faceId = document.getElementById('face-id-overlay');
        const faceIdIcon = document.getElementById('face-id-icon');
        const faceIdText = document.getElementById('face-id-text');
        
        faceId.style.opacity = '1';
        faceId.style.pointerEvents = 'all';
        
        this.log('[Security Auth] Solicitando autorización biométrica (Face ID)...', 'system');
        
        setTimeout(() => {
            // Success State
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]); // Haptic success
            faceIdIcon.innerText = 'check_circle';
            faceIdIcon.style.color = '#10b981';
            faceIdIcon.style.animation = 'none';
            faceIdText.innerText = 'Autorizado';
            
            this.log('[Security Auth] Zero-Trust verificado. Generando token de pago encriptado.', 'auth');
            
            setTimeout(() => {
                faceId.style.opacity = '0';
                faceId.style.pointerEvents = 'none';
                
                // Proceed with actual order processing
                this.finalizeOrder();
                
            }, 800);
            
        }, 1500);
    },
    
    finalizeOrder: function() {
        const orderNotes = document.getElementById('order-notes') ? document.getElementById('order-notes').value : '';
        
        this.track('purchase', { value: this.state.cartTotal, currency: 'MXN' });
        this.log('[Orquesta Pay] Tokenizando tarjeta y procesando cargo (API Webhook)...', 'auth');
        setTimeout(() => {
            this.log('Charge_succeeded: Cobro procesado exitosamente por Orquesta Pay.', 'api');
            this.log(`[Order Router] Inyectando Orden a KDS de la sucursal ${this.state.store}...`, 'system');
            
            if (orderNotes.trim() !== '') {
                this.log(`[NLP AI] Analizando nota: "${orderNotes}". Aplicando protocolo especial en KDS de cocina.`, 'system');
            }
            
            this.log('[HubSpot CRM] Registrando evento de compra para perfilado de cliente...', 'api');
            
            // EVENTO GA4: Compra Exitosa (Purchase)
            const finalTotal = parseFloat(document.getElementById('checkout-total').textContent);
            window.dataLayer.push({
                event: 'purchase',
                ecommerce: {
                    transaction_id: 'WP-' + Math.floor(Math.random() * 10000),
                    value: finalTotal,
                    currency: 'MXN',
                    order_type: this.state.orderType,
                    store: this.state.store
                }
            });
            
            // Llenar resumen de orden en la pantalla de delivery
            const summaryContainer = document.getElementById('delivery-order-summary');
            if (summaryContainer) {
                let itemsHtml = this.state.menuItems.map(item => `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">1x ${item.name}</span>
                        <span style="font-size: 0.9rem; color: #64748b;">$${item.price.toFixed(2)}</span>
                    </div>
                `).join('');
                
                if (this.state.customPretzel.active) {
                    itemsHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.9rem; color: #1e293b; font-weight: 600;">1x Pretzel Maker (${this.state.customPretzel.base})</span>
                        <span style="font-size: 0.9rem; color: #64748b;">$${this.state.customPretzel.price.toFixed(2)}</span>
                    </div>`;
                }

                const pointsEarned = Math.floor(finalTotal); // 1 punto por cada peso
                
                summaryContainer.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                        <h3 style="margin: 0; font-size: 1rem; color: var(--w-blue-dark); font-weight: 800;">Tu Pedido</h3>
                        <span style="font-weight: 800; color: #10b981; font-size: 0.85rem; background: #ecfdf5; padding: 0.2rem 0.5rem; border-radius: 4px;">Pagado</span>
                    </div>
                    <div style="border-bottom: 1px dashed #cbd5e1; margin-bottom: 0.8rem; padding-bottom: 0.5rem;">
                        ${itemsHtml}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                        <strong style="color: var(--w-blue-dark);">Total</strong>
                        <strong style="color: var(--w-blue-dark); font-size: 1.1rem;">$${finalTotal.toFixed(2)}</strong>
                    </div>
                    <div style="background: rgba(255, 123, 0, 0.1); border-radius: 8px; padding: 0.6rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                        <span class="material-symbols-rounded" style="color: var(--w-yellow-dark); font-size: 1.1rem;">stars</span>
                        <span style="font-weight: 800; font-size: 0.85rem; color: var(--w-yellow-dark);">¡Ganaste ${pointsEarned} pts con esta orden!</span>
                    </div>
                `;
            }

            if(this.state.orderType === 'delivery'){
                this.log('[Wetzels Fleet API] Buscando repartidor de la Flota Propia en la zona...', 'api');
            }
            
            this.showStep('delivery');
            this.simulateTracker();
            
            // Trigger Dynamic Island Notification!
            this.triggerDynamicIsland("Pedido Confirmado 🥨", 4000);
            
        }, 1500);
    },

    simulateTracker: function() {
        setTimeout(() => {
            this.log('[Webhook KDS] Actualización: Horneando.', 'api');
            document.getElementById('status-1').classList.remove('active');
            document.getElementById('status-2').classList.add('active');
            
            setTimeout(() => {
                const msg = this.state.orderType === 'delivery' 
                    ? '[Uber Direct Webhook] Repartidor asignado y en camino al domicilio.' 
                    : '[Webhook KDS] Orden lista para Pickup en mostrador.';
                
                this.log(msg, 'api');
                document.getElementById('status-2').classList.remove('active');
                document.getElementById('status-3').classList.add('active');
            }, 3000);
        }, 3000);
    },

    reset: function() {
        this.state = { 
            orderType: 'pickup', store: null, cartTotal: 0, menuItems: [], 
            customPretzel: { active: false, price: 65.00, toppings: [], dips: [], drink: false }, 
            coupon: null, jalapenoStock: 2 
        };
        
        const badge = document.getElementById('jalapeno-badge');
        const dashStatus = document.getElementById('jalapeno-stock-status');
        if (badge) { badge.textContent = 'Solo quedan 2'; badge.style.background = ''; }
        if (dashStatus) dashStatus.innerHTML = '⚠️ STOCK CRÍTICO (Quedan 2)';
        const cards = document.querySelectorAll('.menu-card');
        cards.forEach(card => {
            if (card.querySelector('h4') && card.querySelector('h4').textContent.includes('Jalape') && card.querySelector('h4').textContent.includes('Cheese')) {
                card.style.opacity = '1';
            }
        });
        
        // Reset DOM elements
        document.querySelectorAll('.ingredient-card').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.toggle').forEach(el => el.checked = false);
        document.getElementById('coupon-code').value = '';
        document.getElementById('maker-price').textContent = '65.00';
        document.getElementById('cart-total-header').textContent = '$0.00';
        document.getElementById('header-cart-btn').classList.add('hidden');
        
        document.querySelectorAll('.status-step').forEach(el => el.classList.remove('active'));
        document.getElementById('status-1').classList.add('active');
        
        this.updateVisualPretzel();
        this.updateCartTotal(); // Refresca la UI del carrito flotante (ocultándolo)
        
        this.log('Sesión reseteada. Carrito vaciado.', 'system');
        this.showStep('home');
    }
};

// Start the splash screen when script loads
document.addEventListener('DOMContentLoaded', () => {
    app.initSplash();
    app.showStep('login');
});
