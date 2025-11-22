// Mobile device detection and orientation management
export default class MobileController {
    constructor() {
        this.isMobileDevice = this.detectMobile();
        this.isIOS = this.detectIOS();
        this.isAndroid = this.detectAndroid();
        this.orientationPrompt = null;

        this.setupOrientationListeners();
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    }

    detectIOS() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    }

    detectAndroid() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android/i.test(userAgent.toLowerCase());
    }

    isMobile() {
        return this.isMobileDevice;
    }

    isLandscape() {
        // Check both orientation API and window dimensions
        if (window.screen && window.screen.orientation) {
            return window.screen.orientation.type.includes('landscape');
        }
        // Fallback to window dimensions
        return window.innerWidth > window.innerHeight;
    }

    setupOrientationListeners() {
        // Listen for orientation changes
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });

        // Also listen for resize (covers more cases)
        window.addEventListener('resize', () => {
            this.handleOrientationChange();
        });

        // Initial check
        this.handleOrientationChange();
    }

    handleOrientationChange() {
        if (!this.isMobileDevice) return;

        if (this.isLandscape()) {
            this.hideOrientationPrompt();
        } else {
            this.showOrientationPrompt();
        }
    }

    showOrientationPrompt() {
        if (!this.orientationPrompt) {
            this.orientationPrompt = document.getElementById('orientation-prompt');
        }

        if (this.orientationPrompt) {
            this.orientationPrompt.classList.remove('hidden');
            this.orientationPrompt.classList.add('active');
        }
    }

    hideOrientationPrompt() {
        if (this.orientationPrompt) {
            this.orientationPrompt.classList.add('hidden');
            this.orientationPrompt.classList.remove('active');
        }
    }

    async requestLandscape() {
        if (!this.isMobileDevice) return false;

        try {
            // Try to enter fullscreen first (helps with orientation lock)
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }

            // Try to lock orientation (works on Android Chrome)
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
                return true;
            }
        } catch (error) {
            console.log('Orientation lock not supported:', error);
            // On iOS and some browsers, we can't force orientation
            // Just show the prompt instead
            if (!this.isLandscape()) {
                this.showOrientationPrompt();
            }
        }

        return false;
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }

    getViewportDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    // Prevent default touch behaviors that interfere with game
    preventDefaultTouchBehaviors() {
        // Prevent pull-to-refresh
        document.body.style.overscrollBehavior = 'none';

        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevent pinch zoom
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }
}
