class PrincessCastleGame {
    constructor() {
        this.currentRoom = 0;
        this.score = 0;
        this.princess = document.getElementById('princess');
        this.gameWorld = document.getElementById('game-world');
        this.currentRoomElement = document.getElementById('current-room');
        this.itemsContainer = document.getElementById('items-container');
        this.doorsContainer = document.getElementById('doors-container');
        
        this.princessX = window.innerWidth / 2 - 30;
        this.princessY = window.innerHeight / 2 - 30;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gyroVelocityX = 0;
        this.gyroVelocityY = 0;
        this.keys = {};
        this.gameLoopStarted = false;
        
        this.rooms = [
            { name: "Throne Room", item: { name: "crown", spelling: "crown", class: "item-crown" }, doors: [{ x: 300, y: 120, to: 1 }] },
            { name: "Library", item: { name: "book", spelling: "book", class: "item-book" }, doors: [{ x: 170, y: 200, to: 0 }, { x: 350, y: 150, to: 2 }] },
            { name: "Kitchen", item: { name: "cake", spelling: "cake", class: "item-cake" }, doors: [{ x: 180, y: 250, to: 1 }, { x: 280, y: 120, to: 3 }] },
            { name: "Garden", item: { name: "flower", spelling: "flower", class: "item-flower" }, doors: [{ x: 200, y: 300, to: 2 }, { x: 320, y: 140, to: 4 }] },
            { name: "Bedroom", item: { name: "pillow", spelling: "pillow", class: "item-pillow" }, doors: [{ x: 160, y: 180, to: 3 }, { x: 300, y: 200, to: 5 }] },
            { name: "Ballroom", item: { name: "mask", spelling: "mask", class: "item-mask" }, doors: [{ x: 170, y: 250, to: 4 }, { x: 250, y: 120, to: 6 }] },
            { name: "Tower", item: { name: "telescope", spelling: "telescope", class: "item-telescope" }, doors: [{ x: 180, y: 280, to: 5 }, { x: 200, y: 150, to: 7 }] },
            { name: "Dungeon", item: { name: "key", spelling: "key", class: "item-key" }, doors: [{ x: 300, y: 200, to: 6 }, { x: 180, y: 120, to: 8 }] },
            { name: "Treasury", item: { name: "jewel", spelling: "jewel", class: "item-jewel" }, doors: [{ x: 250, y: 250, to: 7 }, { x: 170, y: 120, to: 9 }] },
            { name: "Observatory", item: { name: "star", spelling: "star", class: "item-star" }, doors: [{ x: 200, y: 200, to: 8 }] }
        ];
        
        this.collectedItems = new Set();
        this.currentItem = null;
        this.gameStarted = false;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.gameStarted = true;
        this.setupEventListeners();
        this.updatePrincessPosition();
        this.setupRoom();
        this.requestGyroscopePermission();
    }
    
    async requestGyroscopePermission() {
        // Always set up keyboard controls first
        this.setupKeyboardControls();
        
        // For iOS, request permission when user first interacts
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // Set up a one-time listener for first user interaction
            const requestPermissionOnInteraction = async () => {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.setupGyroscopeControls();
                    }
                } catch (error) {
                    console.log('Gyroscope permission denied or not available');
                }
                // Remove listener after first attempt
                document.removeEventListener('touchstart', requestPermissionOnInteraction);
                document.removeEventListener('click', requestPermissionOnInteraction);
            };
            
            document.addEventListener('touchstart', requestPermissionOnInteraction, { once: true });
            document.addEventListener('click', requestPermissionOnInteraction, { once: true });
        } else {
            // For Android and other devices, set up gyroscope immediately
            this.setupGyroscopeControls();
        }
    }
    
    setupGyroscopeControls() {
        window.addEventListener('deviceorientation', (event) => {
            if (!this.gameStarted) return;
            
            const gamma = event.gamma;
            const beta = event.beta;
            
            if (gamma !== null && beta !== null) {
                // Only use gyroscope if no keyboard input is detected
                if (!this.hasKeyboardInput()) {
                    this.gyroVelocityX = (gamma / 45) * 3;
                    this.gyroVelocityY = (beta / 45) * 3;
                    
                    this.gyroVelocityX = Math.max(-5, Math.min(5, this.gyroVelocityX));
                    this.gyroVelocityY = Math.max(-5, Math.min(5, this.gyroVelocityY));
                }
            }
        });
        
        if (!this.gameLoopStarted) {
            this.updatePosition();
            this.gameLoopStarted = true;
        }
    }
    
    setupKeyboardControls() {
        this.keys = {};
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault(); // Only prevent arrow keys
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
    }
    
    hasKeyboardInput() {
        return this.keys['ArrowLeft'] || this.keys['ArrowRight'] || 
               this.keys['ArrowUp'] || this.keys['ArrowDown'] ||
               this.keys['a'] || this.keys['A'] || this.keys['d'] || this.keys['D'] ||
               this.keys['w'] || this.keys['W'] || this.keys['s'] || this.keys['S'];
    }
    
    updatePosition() {
        if (!this.gameStarted) {
            requestAnimationFrame(() => this.updatePosition());
            return;
        }
        
        // Reset velocity first
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Check for keyboard input first - it takes priority
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.velocityX = -4;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.velocityX = 4;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) this.velocityY = -4;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) this.velocityY = 4;
        
        // If no keyboard input, use gyroscope
        if (this.velocityX === 0 && this.velocityY === 0) {
            this.velocityX = this.gyroVelocityX || 0;
            this.velocityY = this.gyroVelocityY || 0;
        }
        
        this.princessX += this.velocityX;
        this.princessY += this.velocityY;
        
        this.princessX = Math.max(0, Math.min(window.innerWidth - 60, this.princessX));
        this.princessY = Math.max(0, Math.min(window.innerHeight - 60, this.princessY));
        
        this.updatePrincessPosition();
        this.checkCollisions();
        
        requestAnimationFrame(() => this.updatePosition());
    }
    
    updatePrincessPosition() {
        this.princess.style.left = this.princessX + 'px';
        this.princess.style.top = this.princessY + 'px';
    }
    
    teleportPrincess(clientX, clientY) {
        // Convert click coordinates to game world coordinates
        const gameWorldRect = this.gameWorld.getBoundingClientRect();
        const targetX = clientX - gameWorldRect.left - 30; // Center princess (30px offset)
        const targetY = clientY - gameWorldRect.top - 30;
        
        // Ensure teleport location is within game boundaries
        this.princessX = Math.max(0, Math.min(window.innerWidth - 60, targetX));
        this.princessY = Math.max(0, Math.min(window.innerHeight - 60, targetY));
        
        this.updatePrincessPosition();
    }
    
    setupRoom() {
        const room = this.rooms[this.currentRoom];
        
        this.currentRoomElement.className = `room room-${this.currentRoom}`;
        document.getElementById('current-room-name').textContent = room.name;
        
        this.itemsContainer.innerHTML = '';
        this.doorsContainer.innerHTML = '';
        
        let itemPosition = null;
        
        // Place item first if it hasn't been collected
        if (!this.collectedItems.has(this.currentRoom)) {
            const item = document.createElement('div');
            item.className = `item ${room.item.class}`;
            
            // Get safe position for item that avoids UI and princess
            itemPosition = this.getSafeItemPosition();
            item.style.left = itemPosition.x + 'px';
            item.style.top = itemPosition.y + 'px';
            item.dataset.room = this.currentRoom;
            this.itemsContainer.appendChild(item);
        }
        
        // Place portals randomly, avoiding item and each other
        const placedPortals = [];
        
        room.doors.forEach((doorData, index) => {
            const portal = document.createElement('div');
            portal.className = 'portal';
            
            // Add appropriate portal class based on direction
            if (doorData.to > this.currentRoom) {
                portal.classList.add('forward');
            } else {
                portal.classList.add('backward');
            }
            
            // Get random safe position for this portal
            const portalPosition = this.getSafePortalPosition(placedPortals, itemPosition);
            portal.style.left = portalPosition.x + 'px';
            portal.style.top = portalPosition.y + 'px';
            portal.dataset.to = doorData.to;
            
            // Track this portal's position for future portal placement
            placedPortals.push(portalPosition);
            
            this.doorsContainer.appendChild(portal);
        });
    }
    
    getSafeItemPosition() {
        const itemSize = 40;
        const minDistanceFromPrincess = 120; // Minimum distance from current princess position
        const minDistanceFromCenter = 150; // Minimum distance from screen center (where princess spawns)
        const uiPadding = 150; // Space for UI overlay at top-left
        const maxAttempts = 50;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate random position with UI avoidance
            const x = Math.random() * (window.innerWidth - itemSize - uiPadding) + uiPadding;
            const y = Math.random() * (window.innerHeight - itemSize - 120) + 120;
            
            let validPosition = true;
            
            // Check distance from current princess position
            const distFromPrincess = Math.sqrt(
                Math.pow(x - this.princessX, 2) + Math.pow(y - this.princessY, 2)
            );
            if (distFromPrincess < minDistanceFromPrincess) {
                validPosition = false;
            }
            
            // Check distance from screen center (where princess spawns after skip)
            const distFromCenter = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );
            if (distFromCenter < minDistanceFromCenter) {
                validPosition = false;
            }
            
            if (validPosition) {
                return { x, y };
            }
        }
        
        // Fallback position - place in corner away from center
        return { 
            x: window.innerWidth - 100, 
            y: window.innerHeight - 100 
        };
    }
    
    getSafePortalPosition(existingPortals, itemPosition) {
        const portalSize = 50;
        const minDistance = 100; // Minimum distance from items, other portals, and princess
        const uiPadding = 150; // Space for UI overlay at top-left
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate random position with UI avoidance
            const x = Math.random() * (window.innerWidth - portalSize - uiPadding) + uiPadding;
            const y = Math.random() * (window.innerHeight - portalSize - 120) + 120;
            
            let validPosition = true;
            
            // Check distance from princess
            const distFromPrincess = Math.sqrt(
                Math.pow(x - this.princessX, 2) + Math.pow(y - this.princessY, 2)
            );
            if (distFromPrincess < minDistance) {
                validPosition = false;
            }
            
            // Check distance from item if it exists
            if (validPosition && itemPosition) {
                const distFromItem = Math.sqrt(
                    Math.pow(x - itemPosition.x, 2) + Math.pow(y - itemPosition.y, 2)
                );
                if (distFromItem < minDistance) {
                    validPosition = false;
                }
            }
            
            // Check distance from other portals
            if (validPosition) {
                for (const portal of existingPortals) {
                    const distFromPortal = Math.sqrt(
                        Math.pow(x - portal.x, 2) + Math.pow(y - portal.y, 2)
                    );
                    if (distFromPortal < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                return { x, y };
            }
        }
        
        // Fallback position if no safe spot found
        return { 
            x: Math.random() * (window.innerWidth - portalSize - 200) + 200, 
            y: Math.random() * (window.innerHeight - portalSize - 200) + 200 
        };
    }
    
    checkCollisions() {
        const princessRect = {
            x: this.princessX,
            y: this.princessY,
            width: 60,
            height: 60
        };
        
        const items = this.itemsContainer.querySelectorAll('.item');
        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const gameWorldRect = this.gameWorld.getBoundingClientRect();
            
            const itemPos = {
                x: itemRect.left - gameWorldRect.left,
                y: itemRect.top - gameWorldRect.top,
                width: itemRect.width,
                height: itemRect.height
            };
            
            if (this.isColliding(princessRect, itemPos)) {
                this.collectItem(item);
            }
        });
        
        const portals = this.doorsContainer.querySelectorAll('.portal');
        portals.forEach(portal => {
            const portalRect = portal.getBoundingClientRect();
            const gameWorldRect = this.gameWorld.getBoundingClientRect();
            
            const portalPos = {
                x: portalRect.left - gameWorldRect.left,
                y: portalRect.top - gameWorldRect.top,
                width: portalRect.width,
                height: portalRect.height
            };
            
            if (this.isColliding(princessRect, portalPos)) {
                this.enterPortal(portal);
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    collectItem(itemElement) {
        const roomIndex = parseInt(itemElement.dataset.room);
        const room = this.rooms[roomIndex];
        
        this.currentItem = room.item;
        this.showSpellingModal();
        itemElement.remove();
    }
    
    enterPortal(portalElement) {
        const newRoom = parseInt(portalElement.dataset.to);
        this.currentRoom = newRoom;
        this.setupRoom();
        
        this.princessX = window.innerWidth / 2 - 30;
        this.princessY = window.innerHeight / 2 - 30;
        this.updatePrincessPosition();
    }
    
    showSpellingModal() {
        const modal = document.getElementById('spelling-modal');
        const itemImage = document.getElementById('item-image');
        const itemName = document.getElementById('item-name');
        const spellingInput = document.getElementById('spelling-input');
        const feedback = document.getElementById('spelling-feedback');
        
        itemImage.src = `images/item-${this.currentItem.name}.png`;
        itemName.textContent = `How do you spell this item?`;
        spellingInput.value = '';
        feedback.textContent = '';
        feedback.className = '';
        
        modal.classList.remove('hidden');
        spellingInput.focus();
    }
    
    checkSpelling() {
        const input = document.getElementById('spelling-input').value.toLowerCase().trim();
        const feedback = document.getElementById('spelling-feedback');
        
        if (input === this.currentItem.spelling) {
            feedback.textContent = 'Correct! Well done!';
            feedback.className = 'correct';
            
            this.collectedItems.add(this.currentRoom);
            this.score++;
            document.getElementById('score').textContent = this.score;
            
            setTimeout(() => {
                document.getElementById('spelling-modal').classList.add('hidden');
                this.showCelebrationModal();
            }, 1500);
        } else {
            feedback.textContent = 'Try again! Check your spelling.';
            feedback.className = 'incorrect';
        }
    }
    
    showCelebrationModal() {
        const modal = document.getElementById('celebration-modal');
        const celebrationImage = document.getElementById('celebration-image');
        const celebrationText = document.getElementById('celebration-text');
        
        celebrationImage.src = `images/celebration-${this.currentItem.name}.png`;
        celebrationText.textContent = `The princess found a beautiful ${this.currentItem.name}!`;
        
        modal.classList.remove('hidden');
        
        if (this.score >= 10) {
            setTimeout(() => {
                modal.classList.add('hidden');
                this.showVictoryModal();
            }, 2000);
        }
    }
    
    showVictoryModal() {
        document.getElementById('victory-modal').classList.remove('hidden');
    }
    
    skipItem() {
        document.getElementById('spelling-modal').classList.add('hidden');
        this.currentItem = null;
        
        // Move princess back to center of screen but don't change room
        this.princessX = window.innerWidth / 2 - 30;
        this.princessY = window.innerHeight / 2 - 30;
        this.updatePrincessPosition();
        
        // Re-add the item back to the room since it wasn't collected
        this.respawnSkippedItem();
    }
    
    respawnSkippedItem() {
        const room = this.rooms[this.currentRoom];
        
        // Only respawn if the item container is empty (item was removed during collection attempt)
        if (this.itemsContainer.children.length === 0 && !this.collectedItems.has(this.currentRoom)) {
            const item = document.createElement('div');
            item.className = `item ${room.item.class}`;
            
            // Get new safe position for the respawned item
            const itemPosition = this.getSafeItemPosition();
            item.style.left = itemPosition.x + 'px';
            item.style.top = itemPosition.y + 'px';
            item.dataset.room = this.currentRoom;
            this.itemsContainer.appendChild(item);
        }
    }
    
    continueGame() {
        document.getElementById('celebration-modal').classList.add('hidden');
        this.currentItem = null;
    }
    
    restartGame() {
        this.currentRoom = 0;
        this.score = 0;
        this.collectedItems.clear();
        this.currentItem = null;
        
        document.getElementById('score').textContent = '0';
        document.getElementById('victory-modal').classList.add('hidden');
        
        this.princessX = window.innerWidth / 2 - 30;
        this.princessY = window.innerHeight / 2 - 30;
        this.updatePrincessPosition();
        this.setupRoom();
    }
    
    
    setupEventListeners() {
        document.getElementById('check-spelling').addEventListener('click', () => this.checkSpelling());
        document.getElementById('skip-item').addEventListener('click', () => this.skipItem());
        document.getElementById('continue-game').addEventListener('click', () => this.continueGame());
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        
        document.getElementById('spelling-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkSpelling();
            }
        });
        
        // Click to teleport functionality for desktop
        this.gameWorld.addEventListener('click', (e) => {
            if (!this.gameStarted) return;
            
            // Only allow teleport on desktop (not mobile touch)
            if (e.pointerType === 'touch') return;
            
            this.teleportPrincess(e.clientX, e.clientY);
        });
        
        window.addEventListener('resize', () => {
            this.princessX = Math.max(0, Math.min(window.innerWidth - 60, this.princessX));
            this.princessY = Math.max(0, Math.min(window.innerHeight - 60, this.princessY));
            this.updatePrincessPosition();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PrincessCastleGame();
});