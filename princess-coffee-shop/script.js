class PrincessCoffeeShop {
    constructor() {
        this.score = 0;
        this.ordersCompleted = 0;
        this.currentOrder = {};
        this.itemsMade = { coffee: 0, cupcake: 0, donut: 0 };
        this.itemsNeeded = 0;
        this.isAtStation = { coffee: false, cupcake: false, donut: false };
        this.stationTimers = { coffee: 0, cupcake: 0, donut: 0 };
        this.activeStation = null;
        this.isAtCustomer = false;
        
        this.customers = ['customer1.png', 'customer2.png', 'customer3.png'];
        this.items = [
            { name: 'coffee-cup', image: 'coffee-cup.png', displayName: 'Coffee', station: 'coffee' },
            { name: 'cupcake', image: 'cupcake.png', displayName: 'Cupcake', station: 'cupcake' },
            { name: 'donut', image: 'donut.png', displayName: 'Donut', station: 'donut' }
        ];
        
        // Movement variables
        this.princess = null;
        this.princessX = 0;
        this.princessY = 0;
        this.princessScaleX = 1;
        this.moveSpeed = 4;
        this.keysPressed = {};
        
        // Gamepad variables
        this.gamepadIndex = null;
        this.JOYSTICK_DEADZONE = 0.25;
        
        // Gyroscope variables
        this.motionControlsEnabled = false;
        this.currentGyroX = 0;
        this.currentGyroY = 0;
        this.TILT_DEADZONE = 3;
        this.MAX_EFFECTIVE_ANGLE = 30;
        this.MAX_TILT_INPUT = 1.0;
        
        // Game elements
        this.playArea = null;
        this.P_WIDTH = 0;
        this.P_HEIGHT = 0;
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupMotionControls();
        this.generateOrder();
        this.updateDisplay();
        this.initializePosition();
        this.gameLoop();
    }

    setupElements() {
        this.playArea = document.getElementById('play-area');
        this.princess = document.getElementById('princess');
        this.scoreDisplay = document.getElementById('score-display');
        this.ordersDisplay = document.getElementById('orders-completed');
        this.orderItemsContainer = document.getElementById('order-items');
        this.itemsNeededSpan = document.getElementById('items-needed');
        this.inventory = document.getElementById('princess-inventory');
        this.inventoryItems = {
            coffee: document.getElementById('inventory-coffee'),
            cupcake: document.getElementById('inventory-cupcake'),
            donut: document.getElementById('inventory-donut')
        };
        this.inventoryCounts = {
            coffee: this.inventoryItems.coffee.querySelector('.inventory-count'),
            cupcake: this.inventoryItems.cupcake.querySelector('.inventory-count'),
            donut: this.inventoryItems.donut.querySelector('.inventory-count')
        };
        this.customerImg = document.getElementById('current-customer');
        this.customerSpeech = document.getElementById('customer-speech');
        this.celebrationContainer = document.getElementById('celebration-container');
        
        this.updatePrincessDimensions();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                this.keysPressed[event.key] = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
                this.keysPressed[event.key] = false;
            }
        });

        // Help modal
        const helpBtn = document.querySelector('header');
        if (helpBtn) {
            helpBtn.addEventListener('dblclick', () => this.showHelp());
        }
        
        const modal = document.getElementById('help-modal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Touch controls for mobile
        this.addTouchControls();
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Gamepad event listeners
        window.addEventListener('gamepadconnected', (event) => {
            if (this.gamepadIndex === null && event.gamepad && event.gamepad.axes && event.gamepad.axes.length >= 2) {
                this.gamepadIndex = event.gamepad.index;
                console.log(`Gamepad connected: ${event.gamepad.id}`);
            }
        });
        
        window.addEventListener('gamepaddisconnected', (event) => {
            if (event.gamepad && event.gamepad.index === this.gamepadIndex) {
                this.gamepadIndex = null;
                console.log('Gamepad disconnected');
            }
        });
    }

    addTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isTouching = false;
        
        // Touch start event
        this.playArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isTouching = true;
        }, { passive: false });
        
        // Touch move event for continuous movement
        this.playArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isTouching) return;
            
            const touch = e.touches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            
            // Calculate direction based on touch movement
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 10; // Minimum distance for movement
            
            if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
                // Reset keys first
                this.keysPressed = {};
                
                // Set movement keys based on touch direction
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal movement is dominant
                    if (deltaX > minSwipeDistance) {
                        this.keysPressed['ArrowRight'] = true;
                    } else if (deltaX < -minSwipeDistance) {
                        this.keysPressed['ArrowLeft'] = true;
                    }
                } else {
                    // Vertical movement is dominant
                    if (deltaY > minSwipeDistance) {
                        this.keysPressed['ArrowDown'] = true;
                    } else if (deltaY < -minSwipeDistance) {
                        this.keysPressed['ArrowUp'] = true;
                    }
                }
                
                // Update touch start position for continuous movement
                touchStartX = touchEndX;
                touchStartY = touchEndY;
            }
        }, { passive: false });
        
        // Touch end event
        this.playArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            isTouching = false;
            // Clear all movement keys when touch ends
            this.keysPressed = {};
        }, { passive: false });
        
        // Handle touch cancel
        this.playArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            isTouching = false;
            this.keysPressed = {};
        }, { passive: false });
    }

    setupMotionControls() {
        const enableMotionButton = document.getElementById('enable-motion-button');
        
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                if (enableMotionButton) {
                    enableMotionButton.style.display = 'inline-block';
                    enableMotionButton.addEventListener('click', () => this.requestMotionPermission());
                }
            } else {
                this.requestMotionPermission();
            }
        } else {
            if (enableMotionButton) {
                enableMotionButton.style.display = 'inline-block';
                enableMotionButton.textContent = "Tilt N/A";
                enableMotionButton.disabled = true;
            }
        }
    }

    requestMotionPermission() {
        const enableMotionButton = document.getElementById('enable-motion-button');
        
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', (event) => this.handleOrientation(event));
                        this.motionControlsEnabled = true;
                        if (enableMotionButton) enableMotionButton.style.display = 'none';
                    } else {
                        if (enableMotionButton) enableMotionButton.textContent = "Tilt Denied";
                    }
                })
                .catch(error => {
                    console.error("Error requesting device orientation permission:", error);
                    if (enableMotionButton) enableMotionButton.textContent = "Tilt Error";
                });
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            window.addEventListener('deviceorientation', (event) => this.handleOrientation(event));
            this.motionControlsEnabled = true;
            if (enableMotionButton) enableMotionButton.style.display = 'none';
        }
    }

    handleOrientation(event) {
        if (!this.motionControlsEnabled) return;
        
        let gamma = event.gamma || 0;
        let beta = event.beta || 0;
        
        let tiltX = 0;
        if (Math.abs(gamma) > this.TILT_DEADZONE) {
            tiltX = gamma;
        }
        
        let tiltY = 0;
        if (Math.abs(beta) > this.TILT_DEADZONE) {
            tiltY = beta;
        }
        
        this.currentGyroX = Math.max(-this.MAX_TILT_INPUT, Math.min(this.MAX_TILT_INPUT, tiltX / this.MAX_EFFECTIVE_ANGLE));
        this.currentGyroY = Math.max(-this.MAX_TILT_INPUT, Math.min(this.MAX_TILT_INPUT, tiltY / this.MAX_EFFECTIVE_ANGLE));
    }

    updatePrincessDimensions() {
        if (this.princess) {
            this.P_WIDTH = parseFloat(getComputedStyle(this.princess).width);
            this.P_HEIGHT = parseFloat(getComputedStyle(this.princess).height);
        }
    }

    initializePosition() {
        if (!this.playArea || !this.princess) return;
        
        this.updatePrincessDimensions();
        
        const paWidth = this.playArea.clientWidth;
        const paHeight = this.playArea.clientHeight;
        
        this.princessX = (paWidth - this.P_WIDTH) / 2;
        this.princessY = (paHeight - this.P_HEIGHT) / 2;
        this.princessScaleX = 1;
        
        this.princess.style.left = `${this.princessX}px`;
        this.princess.style.top = `${this.princessY}px`;
        this.princess.style.setProperty('--character-scaleX', this.princessScaleX.toString());
        
        this.updateInventoryPosition();
    }

    generateOrder() {
        this.currentOrder = {};
        this.itemsMade = { coffee: 0, cupcake: 0, donut: 0 };
        this.stationTimers = { coffee: 0, cupcake: 0, donut: 0 };
        this.activeStation = null;
        this.itemsNeeded = 0;
        
        // Generate a random order of 1-5 items
        const orderSize = Math.floor(Math.random() * 5) + 1;
        const availableItems = [...this.items];
        
        for (let i = 0; i < Math.min(orderSize, availableItems.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            const item = availableItems.splice(randomIndex, 1)[0];
            const count = Math.floor(Math.random() * 3) + 1; // 1-3 of each item
            
            this.currentOrder[item.name] = count;
            this.itemsNeeded += count;
        }
        
        this.displayOrder();
        this.changeCustomer();
        this.updateCustomerSpeech();
    }

    displayOrder() {
        this.orderItemsContainer.innerHTML = '';
        
        for (const [itemName, count] of Object.entries(this.currentOrder)) {
            const item = this.items.find(i => i.name === itemName);
            
            for (let i = 0; i < count; i++) {
                const orderItem = document.createElement('div');
                orderItem.className = 'order-item';
                
                const img = document.createElement('img');
                img.src = `assets/${item.image}`;
                img.alt = item.displayName;
                
                orderItem.appendChild(img);
                this.orderItemsContainer.appendChild(orderItem);
            }
        }
        
        this.itemsNeededSpan.textContent = this.itemsNeeded;
    }

    changeCustomer() {
        const randomCustomer = this.customers[Math.floor(Math.random() * this.customers.length)];
        this.customerImg.src = `assets/${randomCustomer}`;
    }

    updateCustomerSpeech() {
        const messages = [
            `I need ${this.itemsNeeded} items please!`,
            "Can you make my order?",
            "I'm waiting for my treats!",
            `${this.itemsNeeded} items would be perfect!`
        ];
        this.customerSpeech.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    gameLoop() {
        this.handleMovement();
        this.checkZones();
        this.updateDisplay();
        requestAnimationFrame(() => this.gameLoop());
    }

    handleMovement() {
        let dx = 0;
        let dy = 0;
        
        // Keyboard input
        if (this.keysPressed['ArrowUp']) dy -= 1;
        if (this.keysPressed['ArrowDown']) dy += 1;
        if (this.keysPressed['ArrowLeft']) dx -= 1;
        if (this.keysPressed['ArrowRight']) dx += 1;
        
        // Gamepad input
        if (this.gamepadIndex !== null && typeof navigator.getGamepads === "function") {
            const gamepadList = navigator.getGamepads();
            if (gamepadList && gamepadList[this.gamepadIndex]) {
                const gp = gamepadList[this.gamepadIndex];
                if (gp && gp.connected) {
                    const axisX = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
                    const axisY = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;
                    if (Math.abs(axisX) > this.JOYSTICK_DEADZONE) dx += axisX;
                    if (Math.abs(axisY) > this.JOYSTICK_DEADZONE) dy += axisY;
                } else { 
                    this.gamepadIndex = null; 
                }
            } else { 
                this.gamepadIndex = null; 
            }
        }
        
        // Gyroscope input
        if (this.motionControlsEnabled) {
            dx += this.currentGyroX;
            dy += this.currentGyroY;
        }
        
        if (dx !== 0 || dy !== 0) {
            // Normalize movement
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude > 0) {
                const normalizedDx = dx / magnitude;
                const normalizedDy = dy / magnitude;
                
                this.princessX += normalizedDx * this.moveSpeed;
                this.princessY += normalizedDy * this.moveSpeed;
                
                // Update facing direction
                if (normalizedDx < -0.01) this.princessScaleX = -1;
                else if (normalizedDx > 0.01) this.princessScaleX = 1;
            }
        }
        
        // Boundary checking
        if (!this.playArea || !this.P_WIDTH || !this.P_HEIGHT) return;
        
        const paWidth = this.playArea.clientWidth;
        const paHeight = this.playArea.clientHeight;
        
        this.princessX = Math.max(0, Math.min(this.princessX, paWidth - this.P_WIDTH));
        this.princessY = Math.max(0, Math.min(this.princessY, paHeight - this.P_HEIGHT));
        
        // Update princess position
        if (this.princess) {
            this.princess.style.left = `${this.princessX}px`;
            this.princess.style.top = `${this.princessY}px`;
            this.princess.style.setProperty('--character-scaleX', this.princessScaleX.toString());
            this.updateInventoryPosition();
        }
    }

    checkZones() {
        if (!this.playArea) return;
        
        const paWidth = this.playArea.clientWidth;
        const paHeight = this.playArea.clientHeight;
        const isMobile = window.innerWidth <= 768;
        
        let stations;
        let customerArea;
        
        if (isMobile) {
            // Mobile horizontal layout - stations at top, delivery at bottom-right
            const stationWidth = window.innerWidth <= 320 ? 75 : (window.innerWidth <= 480 ? 85 : 100);
            const stationHeight = window.innerWidth <= 320 ? 60 : (window.innerWidth <= 480 ? 70 : 80);
            const stationY = window.innerWidth <= 320 ? 5 : (window.innerWidth <= 480 ? 8 : 10);
            
            stations = {
                coffee: { 
                    x: window.innerWidth <= 320 ? 3 : (window.innerWidth <= 480 ? 8 : 10), 
                    y: stationY, 
                    width: stationWidth, 
                    height: stationHeight 
                },
                cupcake: { 
                    x: paWidth / 2 - stationWidth / 2, 
                    y: stationY, 
                    width: stationWidth, 
                    height: stationHeight 
                },
                donut: { 
                    x: paWidth - stationWidth - (window.innerWidth <= 320 ? 3 : (window.innerWidth <= 480 ? 8 : 10)), 
                    y: stationY, 
                    width: stationWidth, 
                    height: stationHeight 
                }
            };
            
            // Customer area at bottom-right
            const customerWidth = window.innerWidth <= 320 ? 85 : (window.innerWidth <= 480 ? 100 : 130);
            const customerHeight = window.innerWidth <= 320 ? 80 : (window.innerWidth <= 480 ? 90 : 100);
            const customerOffset = window.innerWidth <= 320 ? 5 : (window.innerWidth <= 480 ? 8 : 10);
            
            customerArea = {
                x: paWidth - customerWidth - customerOffset,
                y: paHeight - customerHeight - customerOffset,
                width: customerWidth,
                height: customerHeight
            };
        } else {
            // Desktop vertical layout - original positions
            stations = {
                coffee: { x: 30, y: 10, width: 200, height: 200 },
                cupcake: { x: 30, y: paHeight * 0.5 - 100, width: 200, height: 200 },
                donut: { x: 30, y: paHeight - 210, width: 200, height: 200 }
            };
            
            customerArea = {
                x: paWidth - 250,
                y: paHeight / 2 - 100,
                width: 220,
                height: 200
            };
        }
        
        // Check each station
        for (const [stationType, station] of Object.entries(stations)) {
            const atStation = (
                this.princessX < station.x + station.width + 20 &&
                this.princessX + this.P_WIDTH > station.x - 20 &&
                this.princessY < station.y + station.height + 20 &&
                this.princessY + this.P_HEIGHT > station.y - 20
            );
            
            if (atStation && !this.isAtStation[stationType]) {
                this.isAtStation[stationType] = true;
                this.startStationTimer(stationType);
            } else if (!atStation && this.isAtStation[stationType]) {
                this.isAtStation[stationType] = false;
                this.stopStationTimer(stationType);
            }
        }
        
        // Check if at customer area
        const atCustomer = (
            this.princessX < customerArea.x + customerArea.width + 20 &&
            this.princessX + this.P_WIDTH > customerArea.x - 20 &&
            this.princessY < customerArea.y + customerArea.height + 20 &&
            this.princessY + this.P_HEIGHT > customerArea.y - 20
        );
        
        if (atCustomer && !this.isAtCustomer) {
            this.isAtCustomer = true;
            this.handleCustomerInteraction();
        } else if (!atCustomer) {
            this.isAtCustomer = false;
        }
    }

    startStationTimer(stationType) {
        // Don't start if already active at this station
        if (this.activeStation === stationType) {
            return;
        }
        
        // Check if we need items from this station type
        const stationItems = this.items.filter(item => item.station === stationType);
        let neededFromStation = 0;
        
        for (const item of stationItems) {
            if (this.currentOrder[item.name]) {
                neededFromStation += this.currentOrder[item.name];
            }
        }
        
        const madeFromStation = this.itemsMade[stationType];
        
        if (madeFromStation < neededFromStation) {
            this.activeStation = stationType;
            this.stationTimers[stationType] = 0;
            
            // Add active class to station for animation
            const stationElement = document.getElementById(`${stationType}-station`);
            if (stationElement) {
                stationElement.classList.add('active');
            }
            
            // Start the 2-second timer
            this.updateStationTimer(stationType);
        }
    }

    stopStationTimer(stationType) {
        if (this.activeStation === stationType) {
            this.activeStation = null;
        }
        this.stationTimers[stationType] = 0;
        
        // Remove active class from station
        const stationElement = document.getElementById(`${stationType}-station`);
        if (stationElement) {
            stationElement.classList.remove('active', 'completing');
        }
    }

    updateStationTimer(stationType) {
        if (this.activeStation !== stationType || !this.isAtStation[stationType]) {
            return;
        }
        
        this.stationTimers[stationType] += 16; // ~60fps (16ms per frame)
        
        if (this.stationTimers[stationType] >= 2000) { // 2 seconds
            this.completeStationWork(stationType);
        } else {
            // Continue timer
            setTimeout(() => this.updateStationTimer(stationType), 16);
        }
    }

    completeStationWork(stationType) {
        this.itemsMade[stationType]++;
        
        // Add completing animation
        const stationElement = document.getElementById(`${stationType}-station`);
        if (stationElement) {
            stationElement.classList.add('completing');
            setTimeout(() => {
                stationElement.classList.remove('completing');
                // Don't remove 'active' class - keep it for continuous production
            }, 500);
        }
        
        // Play celebration effect
        this.playFireworks(this.princessX + this.P_WIDTH / 2, this.princessY + this.P_HEIGHT / 2);
        
        // Check if we need to continue making items
        this.checkContinuousProduction(stationType);
    }

    checkContinuousProduction(stationType) {
        // Check if princess is still at station and if more items are needed
        if (!this.isAtStation[stationType]) {
            // Princess left, stop production
            this.stopStationTimer(stationType);
            return;
        }

        // Check if we still need more items from this station
        const stationItems = this.items.filter(item => item.station === stationType);
        let neededFromStation = 0;
        
        for (const item of stationItems) {
            if (this.currentOrder[item.name]) {
                neededFromStation += this.currentOrder[item.name];
            }
        }
        
        const madeFromStation = this.itemsMade[stationType];
        
        if (madeFromStation < neededFromStation) {
            // Reset timer for next item - continue production
            this.stationTimers[stationType] = 0;
            this.activeStation = stationType;
            
            // Brief pause then restart timer (adds nice rhythm)
            setTimeout(() => {
                if (this.isAtStation[stationType]) {
                    this.updateStationTimer(stationType);
                }
            }, 100);
        } else {
            // All items made, stop production
            this.stopStationTimer(stationType);
        }
    }

    handleCustomerInteraction() {
        // Check if all items are made
        let totalMade = 0;
        for (const item of this.items) {
            if (this.currentOrder[item.name]) {
                const needed = this.currentOrder[item.name];
                const made = this.itemsMade[item.station];
                const itemsMadeOfThisType = Math.min(made, needed);
                totalMade += itemsMadeOfThisType;
            }
        }
        
        if (totalMade === this.itemsNeeded && this.itemsNeeded > 0) {
            this.completeOrder();
        }
    }

    completeOrder() {
        this.score += this.itemsNeeded * 10;
        this.ordersCompleted++;
        
        // Celebration
        this.playFireworks(this.princessX + this.P_WIDTH / 2, this.princessY + this.P_HEIGHT / 2);
        this.customerSpeech.textContent = "Thank you! Perfect order!";
        
        setTimeout(() => {
            this.generateOrder();
        }, 2000);
    }

    playFireworks(x, y) {
        const numParticles = 12;
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFFFF', '#ff6b6b', '#4ecdc4'];
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.classList.add('firework-particle');
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const rotation = Math.random() * 360 - 180;
            
            particle.style.setProperty('--particle-end-x', `calc(-50% + ${Math.cos(angle) * distance}px)`);
            particle.style.setProperty('--particle-end-y', `calc(-50% + ${Math.sin(angle) * distance}px)`);
            particle.style.setProperty('--particle-end-rotate', `${rotation}deg`);
            
            this.celebrationContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    updateInventoryPosition() {
        if (!this.inventory || !this.princess) return;
        
        // Position inventory below and slightly to the side of princess
        const inventoryX = this.princessX + (this.P_WIDTH / 2) - 90; // Center horizontally
        const inventoryY = this.princessY + this.P_HEIGHT + 10; // Position below princess
        
        this.inventory.style.left = `${inventoryX}px`;
        this.inventory.style.top = `${inventoryY}px`;
    }

    updateInventoryDisplay() {
        for (const [itemType, count] of Object.entries(this.itemsMade)) {
            if (this.inventoryCounts[itemType]) {
                this.inventoryCounts[itemType].textContent = count;
                
                if (count > 0) {
                    this.inventoryItems[itemType].classList.add('has-items');
                } else {
                    this.inventoryItems[itemType].classList.remove('has-items');
                }
            }
        }
    }

    updateDisplay() {
        if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
        if (this.ordersDisplay) this.ordersDisplay.textContent = this.ordersCompleted;
        this.updateInventoryDisplay();
    }

    showHelp() {
        document.getElementById('help-modal').style.display = 'block';
    }

    handleResize() {
        if (!this.playArea || !this.princess) return;
        
        this.updatePrincessDimensions();
        
        const paWidth = this.playArea.clientWidth;
        const paHeight = this.playArea.clientHeight;
        
        if (this.P_WIDTH > 0 && this.P_HEIGHT > 0) {
            this.princessX = Math.max(0, Math.min(this.princessX, paWidth - this.P_WIDTH));
            this.princessY = Math.max(0, Math.min(this.princessY, paHeight - this.P_HEIGHT));
            
            this.princess.style.left = `${this.princessX}px`;
            this.princess.style.top = `${this.princessY}px`;
            this.updateInventoryPosition();
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PrincessCoffeeShop();
});