// Authentication system for admin interface
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private storageKey = 'faceattend_auth';
  
  // In production, these should be environment variables or from a backend
  private adminCredentials = {
    username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
  };

  login(credentials: LoginCredentials): Promise<User> {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        if (
          credentials.username === this.adminCredentials.username &&
          credentials.password === this.adminCredentials.password
        ) {
          const user: User = {
            id: '1',
            username: credentials.username,
            role: 'admin'
          };
          
          // Store session
          localStorage.setItem(this.storageKey, JSON.stringify({
            user,
            timestamp: Date.now()
          }));
          
          resolve(user);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500);
    });
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const { user, timestamp } = JSON.parse(stored);
      
      // Check if session is expired (24 hours)
      const sessionExpiry = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - timestamp > sessionExpiry) {
        this.logout();
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // For kiosk mode - check if kiosk is enabled
  isKioskModeEnabled(): boolean {
    return import.meta.env.VITE_KIOSK_MODE === 'true' || localStorage.getItem('kiosk_mode') === 'true';
  }

  enableKioskMode(): void {
    localStorage.setItem('kiosk_mode', 'true');
  }

  disableKioskMode(): void {
    localStorage.removeItem('kiosk_mode');
  }
}

export const authService = new AuthService(); 