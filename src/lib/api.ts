// Face Recognition API Service
import { API_CONFIG } from '@/config/api';

export interface Employee {
  id: string;
  name: string;
  department?: string;
  email?: string;
  face_enrolled?: boolean;
}

export interface RecognitionResult {
  success: boolean;
  employee?: Employee;
  confidence?: number;
  liveness_score?: number;
  is_live?: boolean;
  message?: string;
  timestamp: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  confidence: number;
  imageUrl?: string;
}

export interface DeepFaceConfig {
  model_name: string;
  distance_metric: string;
  detector_backend: string;
  enforce_detection: boolean;
  confidence_threshold: number;
  align: boolean;
  // Liveness detection settings
  enable_liveness_detection: boolean;
  liveness_threshold: number;
  texture_variance_threshold: number;
  color_std_threshold: number;
  edge_density_min: number;
  edge_density_max: number;
  high_freq_energy_threshold: number;
  hist_entropy_threshold: number;
  saturation_mean_min: number;
  saturation_mean_max: number;
  saturation_std_threshold: number;
  illumination_gradient_min: number;
  illumination_gradient_max: number;
  // Attendance timing settings
  check_in_time: string;
  check_out_time?: string;
  allow_early_checkin: boolean;
  early_checkin_minutes: number;
}

export interface AvailableModels {
  models: string[];
  distance_metrics: string[];
  detector_backends: string[];
  deepface_available: boolean;
}

class FaceRecognitionAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_CONFIG.baseUrl;
  }

  // Configuration endpoints
  async getConfig(): Promise<DeepFaceConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      
      if (!response.ok) {
        throw new Error(`Failed to get config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Config fetch error:', error);
      throw error;
    }
  }

  async updateConfig(config: DeepFaceConfig): Promise<DeepFaceConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to update config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Config update error:', error);
      throw error;
    }
  }

  async getAvailableModels(): Promise<AvailableModels> {
    try {
      const response = await fetch(`${this.baseUrl}/api/models`);
      
      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Models fetch error:', error);
      throw error;
    }
  }

  async recognizeFace(imageData: string): Promise<RecognitionResult> {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'face-capture.jpg');

      const apiResponse = await fetch(`${this.baseUrl}/api/recognize-face`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      return result;
      
    } catch (error) {
      console.error('Face recognition API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Recognition failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async recordAttendance(employeeId: string, type: 'check-in' | 'check-out', confidence: number): Promise<AttendanceRecord> {
    try {
      const formData = new FormData();
      formData.append('employee_id', employeeId);
      formData.append('type', type);
      formData.append('confidence', confidence.toString());

      const response = await fetch(`${this.baseUrl}/api/attendance`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to record attendance: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Transform snake_case to camelCase to match frontend interface
      return {
        id: rawData.id,
        employeeId: rawData.employee_id,
        employeeName: rawData.employee_name,
        type: rawData.type,
        timestamp: rawData.timestamp,
        confidence: rawData.confidence,
        imageUrl: rawData.image_url
      };
    } catch (error) {
      console.error('Attendance recording error:', error);
      throw error;
    }
  }

  async getAttendanceHistory(limit: number = 50): Promise<AttendanceRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/attendance?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.status}`);
      }

      const rawData = await response.json();
      
      // Transform snake_case to camelCase to match frontend interface
      return rawData.map((record: any) => ({
        id: record.id,
        employeeId: record.employee_id,
        employeeName: record.employee_name,
        type: record.type,
        timestamp: record.timestamp,
        confidence: record.confidence,
        imageUrl: record.image_url
      }));
    } catch (error) {
      console.error('Attendance fetch error:', error);
      return [];
    }
  }

  async getEmployees(): Promise<Employee[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Employees fetch error:', error);
      return [];
    }
  }

  async enrollEmployee(imageData: string, employeeData: Omit<Employee, 'id' | 'face_enrolled'>): Promise<Employee> {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'employee-photo.jpg');
      formData.append('name', employeeData.name);
      formData.append('department', employeeData.department || '');
      formData.append('email', employeeData.email || '');

      const apiResponse = await fetch(`${this.baseUrl}/api/employees/enroll`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || `Enrollment failed: ${apiResponse.status}`);
      }

      return await apiResponse.json();
    } catch (error) {
      console.error('Employee enrollment error:', error);
      throw error;
    }
  }

  async updateEmployee(employeeId: string, employeeData: Omit<Employee, 'id' | 'face_enrolled'>): Promise<Employee> {
    try {
      const formData = new FormData();
      formData.append('name', employeeData.name);
      formData.append('department', employeeData.department || '');
      formData.append('email', employeeData.email || '');

      const apiResponse = await fetch(`${this.baseUrl}/api/employees/${employeeId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || `Update failed: ${apiResponse.status}`);
      }

      return await apiResponse.json();
    } catch (error) {
      console.error('Employee update error:', error);
      throw error;
    }
  }

  async deleteEmployee(employeeId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete employee: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Employee deletion error:', error);
      throw error;
    }
  }

  async getEmployeePhoto(employeeId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/employees/${employeeId}/photo`);
      
      if (!response.ok) {
        // Return a placeholder if photo not found
        if (response.status === 404) {
          return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTIwIDEwQzE2LjY4NjMgMTAgMTQgMTIuNjg2MyAxNCAxNkMxNCAxOS4zMTM3IDE2LjY4NjMgMjIgMjAgMjJDMjMuMzEzNyAyMiAyNiAxOS4zMTM3IDI2IDE2QzI2IDEyLjY4NjMgMjMuMzEzNyAxMCAyMCAxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDI0QzEzLjM3MjYgMjQgOCAyOC40NzcyIDggMzRIMzJDMzIgMjguNDc3MiAyNi42Mjc0IDI0IDIwIDI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
        }
        throw new Error(`Failed to get photo: ${response.status}`);
      }

      // Convert response to blob and then to data URL
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Photo fetch error:', error);
      // Return placeholder on error
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTIwIDEwQzE2LjY4NjMgMTAgMTQgMTIuNjg2MyAxNCAxNkMxNCAxOS4zMTM3IDE2LjY4NjMgMjIgMjAgMjJDMjMuMzEzNyAyMiAyNiAxOS4zMTM3IDI2IDE2QzI2IDEyLjY4NjMgMjMuMzEzNyAxMCAyMCAxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTIwIDI0QzEzLjM3MjYgMjQgOCAyOC40NzcyIDggMzRIMzJDMzIgMjguNDc3MiAyNi42Mjc0IDI0IDIwIDI0WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
    }
  }

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

export const faceRecognitionAPI = new FaceRecognitionAPI(); 