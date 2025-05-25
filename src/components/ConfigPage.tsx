import { useState, useEffect } from "react";
import { Settings, Save, RotateCcw, CheckCircle, XCircle, Info, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDeepFaceConfig, useUpdateDeepFaceConfig, useAvailableModels, useHealthCheck } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";
import type { DeepFaceConfig } from "@/lib/api";

const ConfigPage = () => {
  const { data: config, isLoading: configLoading, error: configError } = useDeepFaceConfig();
  const { data: availableModels, isLoading: modelsLoading } = useAvailableModels();
  const { data: health } = useHealthCheck();
  const updateConfig = useUpdateDeepFaceConfig();
  
  const [formData, setFormData] = useState<DeepFaceConfig>({
    model_name: "VGG-Face",
    distance_metric: "cosine",
    detector_backend: "opencv",
    enforce_detection: true,
    confidence_threshold: 0.85,
    align: true,
  });
  
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when config loads
  useEffect(() => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
    }
  }, [config]);

  // Check for changes
  useEffect(() => {
    if (config) {
      const changed = JSON.stringify(formData) !== JSON.stringify(config);
      setHasChanges(changed);
    }
  }, [formData, config]);

  const handleFieldChange = (field: keyof DeepFaceConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(formData);
      toast.success("Configuration Updated", {
        description: "DeepFace settings have been saved successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      toast.error("Update Failed", {
        description: error instanceof Error ? error.message : "Failed to update configuration.",
      });
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData(config);
      setHasChanges(false);
      toast.info("Changes Reset", {
        description: "Configuration has been reset to current values.",
      });
    }
  };

  const getModelDescription = (model: string) => {
    const descriptions: Record<string, string> = {
      "VGG-Face": "Robust and reliable, good for general use",
      "Facenet": "High accuracy, Google's face recognition model",
      "OpenFace": "Lightweight and fast, good for real-time applications",
      "DeepFace": "Facebook's model, balanced performance",
      "DeepID": "Chinese model, good for Asian faces",
      "ArcFace": "State-of-the-art accuracy, slower performance",
      "Dlib": "Classic model, very lightweight",
      "SFace": "Optimized for speed and accuracy balance"
    };
    return descriptions[model] || "Face recognition model";
  };

  const getDetectorDescription = (detector: string) => {
    const descriptions: Record<string, string> = {
      "opencv": "Fast and lightweight, good for most scenarios",
      "ssd": "Single Shot Detector, balanced speed and accuracy",
      "dlib": "High accuracy, slower performance",
      "mtcnn": "Multi-task CNN, very accurate for face detection",
      "retinaface": "State-of-the-art face detection",
      "mediapipe": "Google's MediaPipe, optimized for mobile"
    };
    return descriptions[detector] || "Face detection backend";
  };

  if (configLoading || modelsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">DeepFace Configuration</h2>
            <p className="text-gray-600">Loading configuration...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">DeepFace Configuration</h2>
            <p className="text-gray-600">Manage face recognition settings</p>
          </div>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load configuration. Please check if the backend server is running.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h2 className="text-2xl font-bold">DeepFace Configuration</h2>
            <p className="text-gray-600">Manage face recognition settings</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant={health?.deepface_available ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <Activity className="w-3 h-3" />
            {health?.deepface_available ? "DeepFace Available" : "DeepFace Unavailable"}
          </Badge>
          
          {health && (
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              {health.enrolled_employees || 0} Enrolled
            </Badge>
          )}
        </div>
      </div>

      {/* System Status */}
      {!availableModels?.deepface_available && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            DeepFace is not available. Please install it with: <code className="bg-amber-100 px-1 rounded">pip install deepface</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Face Recognition Model
              <Badge variant="outline" className="text-xs">Core</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select 
                value={formData.model_name} 
                onValueChange={(value) => handleFieldChange('model_name', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.models.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {getModelDescription(formData.model_name)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Distance Metric</Label>
              <Select 
                value={formData.distance_metric} 
                onValueChange={(value) => handleFieldChange('distance_metric', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.distance_metrics.map(metric => (
                    <SelectItem key={metric} value={metric}>
                      {metric}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Method used to calculate face similarity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Detection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Face Detection
              <Badge variant="outline" className="text-xs">Detection</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Detector Backend</Label>
              <Select 
                value={formData.detector_backend} 
                onValueChange={(value) => handleFieldChange('detector_backend', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.detector_backends.map(detector => (
                    <SelectItem key={detector} value={detector}>
                      {detector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {getDetectorDescription(formData.detector_backend)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enforce Detection</Label>
                <p className="text-xs text-gray-600">Require face to be detected</p>
              </div>
              <Switch
                checked={formData.enforce_detection}
                onCheckedChange={(checked) => handleFieldChange('enforce_detection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Face Alignment</Label>
                <p className="text-xs text-gray-600">Align faces before processing</p>
              </div>
              <Switch
                checked={formData.align}
                onCheckedChange={(checked) => handleFieldChange('align', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confidence Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recognition Threshold
              <Badge variant="outline" className="text-xs">Accuracy</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence Threshold</Label>
                <Badge variant="outline">
                  {Math.round(formData.confidence_threshold * 100)}%
                </Badge>
              </div>
              
              <Slider
                value={[formData.confidence_threshold]}
                onValueChange={([value]) => handleFieldChange('confidence_threshold', value)}
                min={0.5}
                max={0.99}
                step={0.01}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>Lower (More permissive)</span>
                <span>Higher (More strict)</span>
              </div>
              
              <p className="text-sm text-gray-600">
                Minimum confidence required for face recognition. Higher values reduce false positives but may increase false negatives.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {hasChanges ? "You have unsaved changes" : "Configuration is up to date"}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || updateConfig.isPending}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateConfig.isPending}
            className="flex items-center gap-2"
          >
            {updateConfig.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Status</Label>
                <p className={health.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                  {health.status}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Current Model</Label>
                <p>{health.config?.model_name || 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Enrolled Users</Label>
                <p>{health.enrolled_employees || 0}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Last Updated</Label>
                <p>{new Date(health.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfigPage; 