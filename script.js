// ===== ENHANCED QUEUEAWAY SYSTEM =====
class QueueAwayPremium {
  constructor() {
    this.currentQueue = null;
    this.userQueues = new Map(); // Store multiple active queues
    this.isTracking = false;
    this.chatBot = new AIQueueAssistant();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollEffects();
    this.initializeNotifications();
    this.loadStoredQueues();
    this.updateMyQueuesDisplay();
    console.log('🚀 QueueAway Premium System Initialized');
  }

  setupEventListeners() {
    // Form submissions
    document.getElementById('createQueueForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createQueue(new FormData(e.target));
    });

    document.getElementById('joinQueueForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.joinQueue(new FormData(e.target));
    });

    // Modal close on outside click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Chat input enter key
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });
  }

  setupScrollEffects() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    });

    // Smooth scrolling for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  initializeNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        // Don't request immediately, wait for user interaction
      }
    }
  }

  loadStoredQueues() {
    try {
      const stored = localStorage.getItem('userQueues');
      if (stored) {
        const queues = JSON.parse(stored);
        Object.entries(queues).forEach(([id, queue]) => {
          this.userQueues.set(id, queue);
        });
        this.startTrackingAllQueues();
      }
    } catch (error) {
      console.warn('Failed to load stored queues:', error);
    }
  }

  saveQueues() {
    try {
      const queuesObj = Object.fromEntries(this.userQueues);
      localStorage.setItem('userQueues', JSON.stringify(queuesObj));
    } catch (error) {
      console.warn('Failed to save queues:', error);
    }
  }

  async createQueue(formData) {
    const queueData = {
      businessName: formData.get('businessName') || 'Sample Business',
      serviceType: formData.get('serviceType') || 'General Service',
      location: formData.get('location') || 'Mumbai',
      serviceTime: parseInt(formData.get('serviceTime')) || 5,
      capacity: parseInt(formData.get('capacity')) || 50
    };

    // Limit free users to 1 created queue
    if (!localStorage.getItem('freeQueueCreated')) {
      localStorage.setItem('freeQueueCreated', 'true');
    } else {
      this.closeModal('createQueueModal');
      this.openModal('proUpgradeModal');
      return;
    }


    // Show loading
    this.showNotification('Creating your smart queue...', 'info');

    // Simulate API call
    await this.delay(2000);

    // Generate queue ID
    const queueId = this.generateQueueId();
    
    // Store queue data
    this.currentQueue = {
      id: queueId,
      ...queueData,
      created: Date.now(),
      currentToken: 1,
      totalServed: 0,
      type: 'owned'
    };

    // Update UI
    document.getElementById('newQueueId').textContent = queueId;
    this.generateQRCode(queueId);

    // Close create modal and open success modal
    this.closeModal('createQueueModal');
    this.openModal('queueCreatedModal');

    this.showNotification('Queue created successfully! 🎉', 'success');

    // Save to storage
    this.userQueues.set(queueId, this.currentQueue);
    this.saveQueues();
    this.updateMyQueuesDisplay();
  }

  async joinQueue(formData) {
    const queueId = formData.get('queueId')?.trim().toUpperCase() || 'QA123456';
    const userName = formData.get('userName') || '';
    const phoneNumber = formData.get('phoneNumber') || '';

    // Check if already in this queue
    if (this.userQueues.has(queueId)) {
      this.showNotification('You are already in this queue!', 'warning');
      return;
    }

    // Show loading
    this.showNotification('Joining queue...', 'info');

    // Simulate API call
    await this.delay(1500);

    // Generate user token
    const tokenNumber = this.generateTokenNumber();
    const position = Math.floor(Math.random() * 15) + 5; // 5-20 people ahead
    const waitTime = Math.floor(position * 0.7) + 2; // Rough estimate

    // Store user data
    const queueData = {
      queueId,
      token: tokenNumber,
      position,
      waitTime,
      joinTime: Date.now(),
      userName,
      phoneNumber,
      type: 'joined',
      businessName: 'Sample Business', // In real app, fetch from API
      serviceType: 'General Service',
      location: 'Mumbai'
    };

    // Update UI
    document.getElementById('userToken').textContent = tokenNumber;
    document.getElementById('userPosition').textContent = position;
    document.getElementById('userWaitTime').textContent = `${waitTime} min`;

    // Close join modal and open success modal
    this.closeModal('joinQueueModal');
    this.openModal('queueJoinedModal');

    this.showNotification('Successfully joined queue! 🎉', 'success');

    // Save queue data
    this.userQueues.set(queueId, queueData);
    this.saveQueues();
    this.updateMyQueuesDisplay();

    // Start position tracking
    this.startPositionTracking(queueId);
  }

  startTrackingAllQueues() {
    this.userQueues.forEach((queue, queueId) => {
      if (queue.type === 'joined' && queue.position > 0) {
        this.startPositionTracking(queueId);
      }
    });
  }

  startPositionTracking(queueId) {
    if (!this.userQueues.has(queueId)) return;

    const intervalId = setInterval(() => {
      const queue = this.userQueues.get(queueId);
      if (!queue || queue.position <= 0) {
        clearInterval(intervalId);
        return;
      }

      // Simulate queue movement
      if (Math.random() > 0.6) { // 40% chance to move forward
        queue.position = Math.max(0, queue.position - 1);
        queue.waitTime = Math.max(0, Math.floor(queue.position * 0.7));

        // Update storage
        this.userQueues.set(queueId, queue);
        this.saveQueues();
        this.updateMyQueuesDisplay();

        // Notify when close to turn
        if (queue.position <= 2 && queue.position > 0) {
          this.showNotification(`Almost your turn in ${queue.businessName}! ${queue.position} people ahead`, 'warning');
          this.sendBrowserNotification(`Queue Update - ${queue.businessName}`, `Almost your turn! ${queue.position} people ahead`);
        } else if (queue.position === 0) {
          this.showNotification(`Your turn is now at ${queue.businessName}! 🎉`, 'success');
          this.sendBrowserNotification(`Queue Update - ${queue.businessName}`, 'Your turn is now! Head to the counter');
          clearInterval(intervalId);
        }
      }
    }, 8000); // Update every 8 seconds
  }

updateMyQueuesDisplay() {
    const container = document.getElementById('activeQueues');
    if (!container) return;

    if (this.userQueues.size === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <h3>No Active Queues</h3>
          <p>Join a queue to see real-time tracking here</p>
          <button class="btn btn-primary" onclick="queueAwaySystem.openJoinQueueModal()">
            <i class="fas fa-plus"></i>
            Join Your First Queue
          </button>
        </div>
      `;
      return;
    }

    const ownedQueues = Array.from(this.userQueues.values()).filter(q => q.type === 'owned');
    const joinedQueues = Array.from(this.userQueues.values()).filter(q => q.type === 'joined');

    let html = '';

    if (ownedQueues.length > 0) {
      html += `<h3 style="margin-bottom:1rem;">My Created Queues</h3>`;
      html += ownedQueues.map(q => this.generateQueueCardHTML(q)).join('');
    }

    if (joinedQueues.length > 0) {
      html += `<h3 style="margin-top:2rem; margin-bottom:1rem;">Joined Queues</h3>`;
      html += joinedQueues.map(q => this.generateQueueCardHTML(q)).join('');
    }

    container.innerHTML = html;
}
    updateMyQueuesDisplay() {
    const container = document.getElementById('activeQueues');
    if (!container) return;

    if (this.userQueues.size === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <h3>No Active Queues</h3>
          <p>Join a queue to see real-time tracking here</p>
          <button class="btn btn-primary" onclick="queueAwaySystem.openJoinQueueModal()">
            <i class="fas fa-plus"></i>
            Join Your First Queue
          </button>
        </div>
      `;
      return;
    }

    const queuesHTML = Array.from(this.userQueues.values())
      .map(queue => this.generateQueueCardHTML(queue))
      .join('');

    container.innerHTML = queuesHTML;
  }

  generateQueueCardHTML(queue) {
    const isActive = queue.position > 0;
    const statusClass = isActive ? 'active' : 'completed';
    const statusText = isActive ? `Position: ${queue.position}` : 'Completed';
    const statusIcon = isActive ? 'clock' : 'check-circle';

    return `
      <div class="queue-card" data-queue-id="${queue.queueId}">
        <div class="queue-header">
          <div class="queue-info">
            <h4>${queue.businessName}</h4>
            <p>${queue.serviceType} • ${queue.location}</p>
          </div>
          <div class="queue-status ${statusClass}">
            <i class="fas fa-${statusIcon}"></i>
            ${statusText}
          </div>
        </div>
        
        <div class="queue-stats">
          <div class="queue-stat">
            <div class="queue-stat-value">${queue.token}</div>
            <div class="queue-stat-label">Your Token</div>
          </div>
          <div class="queue-stat">
            <div class="queue-stat-value">${isActive ? queue.waitTime + 'm' : '0m'}</div>
            <div class="queue-stat-label">Wait Time</div>
          </div>
          <div class="queue-stat">
            <div class="queue-stat-value">${new Date(queue.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div class="queue-stat-label">Joined</div>
          </div>
        </div>
        
        ${isActive ? `
          <div style="display: flex; gap: 1rem; margin-top: 1rem;">
            <button class="btn btn-secondary" style="flex: 1;" onclick="queueAwaySystem.sharePosition('${queue.queueId}')">
              <i class="fas fa-share"></i>
              Share
            </button>
            <button class="btn btn-danger" style="flex: 1;" onclick="queueAwaySystem.leaveQueue('${queue.queueId}')">
              <i class="fas fa-times"></i>
              Leave Queue
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  leaveQueue(queueId) {
    if (this.userQueues.has(queueId)) {
      const queue = this.userQueues.get(queueId);
      this.userQueues.delete(queueId);
      this.saveQueues();
      this.updateMyQueuesDisplay();
      this.showNotification(`Left queue at ${queue.businessName}`, 'info');
    }
  }

  sharePosition(queueId) {
    const queue = this.userQueues.get(queueId);
    if (!queue) return;

    if (navigator.share) {
      navigator.share({
        title: 'My Queue Position - QueueAway',
        text: `I'm #${queue.position} in line at ${queue.businessName}! Estimated wait: ${queue.waitTime} minutes`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      const shareText = `I'm #${queue.position} in line at ${queue.businessName}! Estimated wait: ${queue.waitTime} minutes - QueueAway`;
      navigator.clipboard.writeText(shareText).then(() => {
        this.showNotification('Position copied to clipboard! 📋', 'success');
      });
    }
  }

  generateQueueId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'QA';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateTokenNumber() {
    const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const number = Math.floor(Math.random() * 900) + 100; // 100-999
    return `${prefix}${number}`;
  }

  generateQRCode(queueId) {
    const qrContainer = document.getElementById('generatedQR');
    if (qrContainer) {
      // In a real implementation, you'd use a QR code library
      qrContainer.innerHTML = `
        <div style="background: white; width: 180px; height: 180px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
          <div style="text-align: center; color: #000;">
            <i class="fas fa-qrcode" style="font-size: 3rem; margin-bottom: 0.5rem;"></i>
            <div style="font-size: 0.8rem; font-weight: 600;">${queueId}</div>
          </div>
        </div>
      `;
    }
  }

  requestCameraAccess() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          this.showNotification('Camera access granted! QR scanning enabled 📷', 'success');
          // In a real implementation, you'd initialize QR scanner here
          stream.getTracks().forEach(track => track.stop()); // Stop for demo
        })
        .catch(err => {
          this.showNotification('Camera access denied. Please use Queue ID instead.', 'error');
        });
    } else {
      this.showNotification('Camera not supported on this device.', 'error');
    }
  }

  enableNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showNotification('Notifications enabled! We\'ll alert you when it\'s almost your turn 🔔', 'success');
        } else {
          this.showNotification('Notifications blocked. Please enable in browser settings.', 'warning');
        }
      });
    }
  }

  sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'queue-update'
      });
    }
  }

  shareQueue() {
    const queueId = document.getElementById('newQueueId').textContent;
    const shareText = `Join my queue! Queue ID: ${queueId} - QueueAway`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join My Queue - QueueAway',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        this.showNotification('Queue details copied to clipboard! 📋', 'success');
      });
    }
  }

  downloadQR() {
    // In a real implementation, you'd generate and download the actual QR code
    this.showNotification('QR Code downloaded! 📥', 'success');
  }

  // Chat functionality
  toggleChat() {
    const chatContainer = document.getElementById('aiAssistant');
    const toggleIcon = document.querySelector('.chat-toggle i');
    
    if (chatContainer.classList.contains('active')) {
      chatContainer.classList.remove('active');
      toggleIcon.className = 'fas fa-plus';
    } else {
      chatContainer.classList.add('active');
      toggleIcon.className = 'fas fa-minus';
    }
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    this.addMessageToChat(message, 'user');
    input.value = '';

    // Get AI response
    setTimeout(() => {
      const response = this.chatBot.getResponse(message, this.userQueues);
      this.addMessageToChat(response, 'bot');
    }, 1000);
  }

  sendQuickMessage(message) {
    this.addMessageToChat(message, 'user');
    
    setTimeout(() => {
      const response = this.chatBot.getResponse(message, this.userQueues);
      this.addMessageToChat(response, 'bot');
    }, 1000);
  }

  addMessageToChat(content, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    messageDiv.innerHTML = `
      <div class="message-content">
        ${typeof content === 'string' ? `<p>${content}</p>` : content}
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Modal Management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  openJoinQueueModal() {
    this.openModal('joinQueueModal');
  }

  // Notification System
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Trigger show animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      'success': 'check-circle',
      'error': 'exclamation-triangle',
      'warning': 'exclamation-circle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  toggleMobileMenu() {
    // Mobile menu implementation
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ===== AI QUEUE ASSISTANT =====
class AIQueueAssistant {
  constructor() {
    this.responses = {
      greeting: [
        "Hello! I'm your AI Queue Assistant. How can I help you optimize your waiting experience today?",
        "Hi there! Ready to revolutionize how you wait in lines? What can I assist you with?",
        "Welcome! I'm here to make your queue experience smarter and more efficient. What would you like to know?"
      ],
      findQueues: [
        "🔍 I can help you find nearby queues! However, I'd need location access to show you real-time queues in your area. For now, you can join any queue using a Queue ID or QR code.",
        "📍 To find nearby queues, I recommend checking with local businesses that display QueueAway QR codes. Popular locations include hospitals, banks, restaurants, and government offices.",
        "🏢 Many businesses in Mumbai, Delhi, and Bangalore are already using QueueAway! Look for our QR codes at reception desks or ask staff for the Queue ID."
      ],
      waitTime: [
        "⏰ Wait times depend on several factors: current queue length, service time per person, and time of day. Our AI predicts wait times with 85% accuracy!",
        "📊 I analyze historical data to predict wait times. Peak hours (10-12 AM, 2-4 PM) usually have longer waits. Try visiting during off-peak hours for shorter waits!",
        "⚡ Pro tip: Our premium users get priority notifications and can see predicted wait times before joining any queue!"
      ],
      optimize: [
        "🚀 Here are my top optimization tips:\n• Join queues during off-peak hours\n• Enable notifications to get alerts\n• Use our wait time predictions\n• Consider virtual queuing to avoid physical waiting",
        "💡 Smart queue strategies:\n• Check multiple locations for shorter waits\n• Join queues remotely when possible\n• Use our AI predictions for best timing\n• Set up notifications for position updates",
        "⭐ Advanced tips:\n• Monitor queue patterns throughout the week\n• Use our heatmap feature (coming soon!)\n• Join multiple queues and cancel the slower ones\n• Share queues with family/friends for coordination"
      ],
      help: [
        "❓ I can help with:\n• Finding nearby queues\n• Understanding wait times\n• Queue optimization strategies\n• Troubleshooting app features\n• Best practices for efficient waiting",
        "🛠️ Common issues I can solve:\n• Can't join a queue? Check the Queue ID format\n• Not receiving notifications? Enable them in settings\n• Position not updating? Check your internet connection\n• Want to leave early? You can safely exit and return anytime",
        "📱 QueueAway features I can explain:\n• Real-time position tracking\n• AI-powered wait time predictions\n• Smart notifications system\n• Multi-queue management\n• Business queue creation tools"
      ],
      default: [
        "I'm still learning! Could you rephrase that or try asking about finding queues, wait times, or optimization tips?",
        "That's interesting! While I focus on queue management, feel free to ask me about wait times, nearby queues, or optimization strategies.",
        "I specialize in queue-related assistance. Try asking me about finding queues, predicting wait times, or getting optimization tips!"
      ]
    };
  }

  getResponse(message, userQueues = new Map()) {
    const msg = message.toLowerCase();
    
    // Check for user's active queues context
    if (userQueues.size > 0) {
      if (msg.includes('status') || msg.includes('position') || msg.includes('how long')) {
        return this.getQueueStatus(userQueues);
      }
      
      if (msg.includes('next') || msg.includes('when') || msg.includes('turn')) {
        return this.getNextTurnPrediction(userQueues);
      }
    }

    // General responses
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return this.getRandomResponse('greeting');
    }
    
    if (msg.includes('find') || msg.includes('nearby') || msg.includes('location')) {
      return this.getRandomResponse('findQueues');
    }
    
    if (msg.includes('wait') || msg.includes('time') || msg.includes('long')) {
      return this.getRandomResponse('waitTime');
    }
    
    if (msg.includes('optimize') || msg.includes('faster') || msg.includes('efficient') || msg.includes('tips')) {
      return this.getRandomResponse('optimize');
    }
    
    if (msg.includes('help') || msg.includes('support') || msg.includes('how')) {
      return this.getRandomResponse('help');
    }

    return this.getRandomResponse('default');
  }

  getQueueStatus(userQueues) {
    const activeQueues = Array.from(userQueues.values()).filter(q => q.position > 0);
    
    if (activeQueues.length === 0) {
      return "📋 You don't have any active queues right now. Would you like me to help you find and join a queue?";
    }

    if (activeQueues.length === 1) {
      const queue = activeQueues[0];
      return `📍 **${queue.businessName}**\n🎫 Token: ${queue.token}\n👥 Position: ${queue.position}\n⏰ Est. Wait: ${queue.waitTime} minutes\n\n${queue.position <= 3 ? "🔥 You're almost up! Get ready!" : "😊 You can relax for a bit more."}`;
    }

    let statusText = `📊 You're in ${activeQueues.length} queues:\n\n`;
    activeQueues.forEach((queue, index) => {
      statusText += `${index + 1}. **${queue.businessName}**\n   Position: ${queue.position} | Wait: ${queue.waitTime}min\n\n`;
    });
    statusText += "💡 I recommend focusing on the queue with the shortest wait time!";
    
    return statusText;
  }

  getNextTurnPrediction(userQueues) {
    const activeQueues = Array.from(userQueues.values()).filter(q => q.position > 0);
    
    if (activeQueues.length === 0) {
      return "🤔 You're not currently in any queues. Join one first, and I'll help predict when your turn will be!";
    }

    const nextQueue = activeQueues.reduce((min, queue) => 
      queue.position < min.position ? queue : min
    );

    const estimatedMinutes = nextQueue.waitTime;
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000);
    
    return `🎯 **Next Turn Prediction:**\n\n📍 ${nextQueue.businessName}\n🎫 Your Token: ${nextQueue.token}\n⏰ Estimated Time: ${estimatedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n📱 You'll get a notification when you're 2 people away!\n\n${estimatedMinutes <= 5 ? "🚨 Head over soon!" : "😌 You have time to relax or run a quick errand."}`;
  }

  getRandomResponse(category) {
    const responses = this.responses[category] || this.responses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Global functions for onclick handlers
function openCreateQueueModal() {
  queueAwaySystem.openModal('createQueueModal');
}

function openJoinQueueModal() {
  queueAwaySystem.openJoinQueueModal();
}

function closeModal(modalId) {
  queueAwaySystem.closeModal(modalId);
}

function requestCameraAccess() {
  queueAwaySystem.requestCameraAccess();
}

function enableNotifications() {
  queueAwaySystem.enableNotifications();
}

function shareQueue() {
  queueAwaySystem.shareQueue();
}

function downloadQR() {
  queueAwaySystem.downloadQR();
}

function toggleChat() {
  queueAwaySystem.toggleChat();
}

function sendMessage() {
  queueAwaySystem.sendMessage();
}

function sendQuickMessage(message) {
  queueAwaySystem.sendQuickMessage(message);
}

// Initialize the system
let queueAwaySystem;
document.addEventListener('DOMContentLoaded', () => {
  queueAwaySystem = new QueueAwayPremium();
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}