import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { faceRecognitionAPI, type Employee, type AttendanceRecord, type RecognitionResult, type DeepFaceConfig, type AvailableModels, type AttendanceMode } from '@/lib/api';

// Configuration hooks
export const useDeepFaceConfig = () => {
  return useQuery({
    queryKey: ['deepface-config'],
    queryFn: () => faceRecognitionAPI.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateDeepFaceConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: DeepFaceConfig) => faceRecognitionAPI.updateConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deepface-config'] });
    },
  });
};

export const useAvailableModels = () => {
  return useQuery({
    queryKey: ['available-models'],
    queryFn: () => faceRecognitionAPI.getAvailableModels(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Attendance Mode Hook
export const useAttendanceMode = () => {
  return useQuery({
    queryKey: ['attendance-mode'],
    queryFn: () => faceRecognitionAPI.getAttendanceMode(),
    refetchInterval: 60 * 1000, // Refetch every minute to update mode
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: () => faceRecognitionAPI.healthCheck(),
    refetchInterval: 30 * 1000, // Every 30 seconds
    staleTime: 20 * 1000, // 20 seconds
  });
};

// Face Recognition Hook
export const useFaceRecognition = () => {
  return useMutation({
    mutationFn: (imageData: string) => faceRecognitionAPI.recognizeFace(imageData),
    onSuccess: (result: RecognitionResult) => {
      if (result.success) {
        console.log('Face recognized successfully:', result.employee);
      } else {
        console.warn('Face recognition failed:', result.message);
      }
    },
    onError: (error) => {
      console.error('Face recognition error:', error);
    },
  });
};

// Attendance Recording Hook
export const useRecordAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, type, confidence, imageData }: { 
      employeeId: string; 
      type: 'check-in' | 'check-out'; 
      confidence: number;
      imageData?: string; 
    }) => faceRecognitionAPI.recordAttendance(employeeId, type, confidence, imageData),
    onSuccess: () => {
      // Invalidate attendance history to refetch latest data
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
    },
  });
};

// Attendance History Hook
export const useAttendanceHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['attendance-history', limit],
    queryFn: () => faceRecognitionAPI.getAttendanceHistory(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Employees Hook
export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: () => faceRecognitionAPI.getEmployees(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Employee Enrollment Hook
export const useEnrollEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ imageData, employeeData }: { 
      imageData: string; 
      employeeData: Omit<Employee, 'id' | 'face_enrolled'>; 
    }) => faceRecognitionAPI.enrollEmployee(imageData, employeeData),
    onSuccess: () => {
      // Invalidate employees list to include new employee
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Employee Update Hook
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ employeeId, employeeData }: { 
      employeeId: string; 
      employeeData: Omit<Employee, 'id' | 'face_enrolled'>; 
    }) => faceRecognitionAPI.updateEmployee(employeeId, employeeData),
    onSuccess: () => {
      // Invalidate employees list to reflect updated employee
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Employee Photo Hook
export const useEmployeePhoto = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-photo', employeeId],
    queryFn: () => faceRecognitionAPI.getEmployeePhoto(employeeId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!employeeId, // Only run if employeeId is provided
  });
};

// Attendance Photo Hook
export const useAttendancePhoto = (attendanceId: string) => {
  return useQuery({
    queryKey: ['attendance-photo', attendanceId],
    queryFn: () => faceRecognitionAPI.getAttendancePhoto(attendanceId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!attendanceId, // Only run if attendanceId is provided
  });
};

// Employee Deletion Hook
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeId: string) => faceRecognitionAPI.deleteEmployee(employeeId),
    onSuccess: () => {
      // Invalidate employees list to remove deleted employee
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

// Combined Face Recognition + Attendance Recording
export const useITScenceAttendance = () => {
  const faceRecognition = useFaceRecognition();
  const recordAttendance = useRecordAttendance();
  
  const processAttendance = async (imageData: string, attendanceType: 'check-in' | 'check-out' = 'check-in') => {
    try {
      // First, recognize the face
      const recognitionResult = await faceRecognition.mutateAsync(imageData);
      
      if (recognitionResult.success && recognitionResult.employee && recognitionResult.confidence) {
        // If recognition successful, record attendance with the captured image
        const attendanceRecord = await recordAttendance.mutateAsync({
          employeeId: recognitionResult.employee.id,
          type: attendanceType,
          confidence: recognitionResult.confidence,
          imageData, // Pass the captured image
        });
        
        return {
          success: true,
          employee: recognitionResult.employee,
          attendance: attendanceRecord,
          confidence: recognitionResult.confidence,
          liveness_score: recognitionResult.liveness_score,
          is_live: recognitionResult.is_live,
        };
      } else {
        return {
          success: false,
          message: recognitionResult.message || 'Face not recognized',
          liveness_score: recognitionResult.liveness_score,
          is_live: recognitionResult.is_live,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Process failed',
      };
    }
  };

  return {
    processAttendance,
    isProcessing: faceRecognition.isPending || recordAttendance.isPending,
    error: faceRecognition.error || recordAttendance.error,
  };
}; 