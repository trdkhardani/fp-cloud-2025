import { useState, useEffect } from "react";
import { Settings, Save, RotateCcw, CheckCircle, XCircle, Info, Activity, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
    // Liveness detection settings
    enable_liveness_detection: true,
    liveness_threshold: 0.4,
    texture_variance_threshold: 50,
    color_std_threshold: 15,
    edge_density_min: 0.03,
    edge_density_max: 0.20,
    high_freq_energy_threshold: 2.5,
    hist_entropy_threshold: 5.5,
    saturation_mean_min: 20,
    saturation_mean_max: 150,
    saturation_std_threshold: 15,
    illumination_gradient_min: 1.0,
    illumination_gradient_max: 12.0,
    // Attendance timing settings
    check_in_time: "09:00",
    check_out_time: "17:00",
    allow_early_checkin: true,
    early_checkin_minutes: 30,
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

        {/* Liveness Detection Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Anti-Spoofing & Liveness Detection
              <Badge variant="outline" className="text-xs">Security</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label>Enable Liveness Detection</Label>
                <p className="text-xs text-gray-600">Prevent photo spoofing attacks</p>
              </div>
              <Switch
                checked={formData.enable_liveness_detection}
                onCheckedChange={(checked) => handleFieldChange('enable_liveness_detection', checked)}
              />
            </div>

            {formData.enable_liveness_detection && (
              <>
                {/* Main Threshold */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Liveness Threshold</Label>
                    <Badge variant="outline">
                      {Math.round(formData.liveness_threshold * 100)}%
                    </Badge>
                  </div>
                  
                  <Slider
                    value={[formData.liveness_threshold]}
                    onValueChange={([value]) => handleFieldChange('liveness_threshold', value)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Permissive (Allow more images)</span>
                    <span>Strict (Require clear live faces)</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Main threshold for determining if a face is live. Lower values are more permissive for webcams.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <Label className="text-sm">Quick Presets</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Webcam-friendly settings
                        setFormData(prev => ({
                          ...prev,
                          liveness_threshold: 0.3,
                          texture_variance_threshold: 30,
                          color_std_threshold: 10,
                          edge_density_min: 0.02,
                          edge_density_max: 0.25,
                        }));
                      }}
                      className="text-xs"
                    >
                      Webcam Friendly
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Balanced settings
                        setFormData(prev => ({
                          ...prev,
                          liveness_threshold: 0.4,
                          texture_variance_threshold: 50,
                          color_std_threshold: 15,
                          edge_density_min: 0.03,
                          edge_density_max: 0.20,
                        }));
                      }}
                      className="text-xs"
                    >
                      Balanced
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // High security settings
                        setFormData(prev => ({
                          ...prev,
                          liveness_threshold: 0.6,
                          texture_variance_threshold: 80,
                          color_std_threshold: 20,
                          edge_density_min: 0.05,
                          edge_density_max: 0.15,
                        }));
                      }}
                      className="text-xs"
                    >
                      High Security
                    </Button>
                  </div>
                </div>

                {/* Advanced Settings */}
                <details className="space-y-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Advanced Liveness Parameters
                  </summary>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                    {/* Texture Variance */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Texture Variance</Label>
                        <span className="text-xs text-gray-500">{formData.texture_variance_threshold.toFixed(0)}</span>
                      </div>
                      <Slider
                        value={[formData.texture_variance_threshold]}
                        onValueChange={([value]) => handleFieldChange('texture_variance_threshold', value)}
                        min={10}
                        max={150}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Color Standard Deviation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Color Variation</Label>
                        <span className="text-xs text-gray-500">{formData.color_std_threshold.toFixed(0)}</span>
                      </div>
                      <Slider
                        value={[formData.color_std_threshold]}
                        onValueChange={([value]) => handleFieldChange('color_std_threshold', value)}
                        min={5}
                        max={40}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Edge Density Range */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Edge Density Min</Label>
                        <span className="text-xs text-gray-500">{formData.edge_density_min.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[formData.edge_density_min]}
                        onValueChange={([value]) => handleFieldChange('edge_density_min', value)}
                        min={0.01}
                        max={0.1}
                        step={0.01}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Edge Density Max</Label>
                        <span className="text-xs text-gray-500">{formData.edge_density_max.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[formData.edge_density_max]}
                        onValueChange={([value]) => handleFieldChange('edge_density_max', value)}
                        min={0.1}
                        max={0.4}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 pl-4">
                    Fine-tune these parameters if the presets don't work well with your camera setup.
                  </p>
                </details>
              </>
            )}
          </CardContent>
        </Card>

        {/* Attendance Timing Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Attendance Schedule
              <Badge variant="outline" className="text-xs">Timing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Time */}
              <div className="space-y-3">
                <Label htmlFor="checkin-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Check-in Time
                </Label>
                <Input
                  id="checkin-time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={(e) => handleFieldChange('check_in_time', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Official check-in time for the workday
                </p>
              </div>

              {/* Check-out Time */}
              <div className="space-y-3">
                <Label htmlFor="checkout-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Check-out Time (Optional)
                </Label>
                <Input
                  id="checkout-time"
                  type="time"
                  value={formData.check_out_time || ""}
                  onChange={(e) => handleFieldChange('check_out_time', e.target.value || undefined)}
                  className="w-full"
                  placeholder="Leave empty if not required"
                />
                <p className="text-xs text-gray-600">
                  Official check-out time (leave empty if check-out is not required)
                </p>
              </div>
            </div>

            {/* Early Check-in Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Early Check-in</Label>
                  <p className="text-xs text-gray-600">Permit check-in before scheduled time</p>
                </div>
                <Switch
                  checked={formData.allow_early_checkin}
                  onCheckedChange={(checked) => handleFieldChange('allow_early_checkin', checked)}
                />
              </div>

              {formData.allow_early_checkin && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Early Check-in Window</Label>
                    <Badge variant="outline">
                      {formData.early_checkin_minutes} minutes
                    </Badge>
                  </div>
                  
                  <Slider
                    value={[formData.early_checkin_minutes]}
                    onValueChange={([value]) => handleFieldChange('early_checkin_minutes', value)}
                    min={5}
                    max={120}
                    step={5}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>5 minutes</span>
                    <span>2 hours</span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    How many minutes before the scheduled time users can check in
                  </p>
                </div>
              )}
            </div>

            {/* Time Preview */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Schedule Preview</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Check-in:</strong> {formData.check_in_time}
                  {formData.allow_early_checkin && (
                    <span className="text-blue-600">
                      {" "}(earliest: {new Date(`2000-01-01T${formData.check_in_time}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).split(':').map((part, i) => 
                        i === 1 ? String(Math.max(0, parseInt(part) - formData.early_checkin_minutes % 60)).padStart(2, '0') :
                        i === 0 ? String(Math.max(0, parseInt(part) - Math.floor(formData.early_checkin_minutes / 60))).padStart(2, '0') : part
                      ).join(':')})
                    </span>
                  )}
                </p>
                {formData.check_out_time && (
                  <p><strong>Check-out:</strong> {formData.check_out_time}</p>
                )}
                {!formData.check_out_time && (
                  <p><strong>Check-out:</strong> <span className="text-blue-600">Not required</span></p>
                )}
              </div>
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