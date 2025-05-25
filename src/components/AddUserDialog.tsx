import { useState, useRef } from "react";
import { Camera, User, Building, Mail, X, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useEnrollEmployee } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";

interface AddUserDialogProps {
  onUserAdded?: () => void;
  trigger?: React.ReactNode;
}

const AddUserDialog = ({ onUserAdded, trigger }: AddUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'info' | 'photo' | 'confirm'>('info');
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    email: '',
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const enrollEmployee = useEnrollEmployee();

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Camera Error", {
        description: "Could not access camera. Please check permissions.",
      });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
        setStep('confirm');
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep('photo');
    startCamera();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Validation Error", {
        description: "Please enter employee name.",
      });
      return;
    }

    if (!capturedImage) {
      toast.error("Validation Error", {
        description: "Please capture a photo.",
      });
      return;
    }

    try {
      await enrollEmployee.mutateAsync({
        imageData: capturedImage,
        employeeData: {
          name: formData.name.trim(),
          department: formData.department.trim() || undefined,
          email: formData.email.trim() || undefined,
        },
      });

      toast.success("Success!", {
        description: `${formData.name} has been enrolled successfully.`,
      });

      // Reset form
      setFormData({ name: '', department: '', email: '' });
      setCapturedImage(null);
      setStep('info');
      setOpen(false);
      onUserAdded?.();

    } catch (error) {
      toast.error("Enrollment Failed", {
        description: error instanceof Error ? error.message : "Failed to enroll employee.",
      });
    }
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setStep('info');
    setCapturedImage(null);
    setFormData({ name: '', department: '', email: '' });
  };

  const renderInfoStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Full Name *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter employee full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="department" className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          Department
        </Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          placeholder="Enter department (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address (optional)"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => setStep('photo')}
          disabled={!formData.name.trim()}
        >
          Next: Take Photo
          <Camera className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPhotoStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Capture Face Photo</h3>
        <p className="text-sm text-gray-600">Position your face in the center and ensure good lighting</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-black aspect-video flex items-center justify-center">
            {isCapturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Face detection overlay */}
                <div className="absolute inset-0 border-2 border-blue-400 border-dashed opacity-50 m-12 rounded-lg"></div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/60 text-white px-3 py-2 rounded-lg text-sm text-center">
                    Look directly at the camera and ensure your face is well-lit
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-white">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Camera not active</p>
                <p className="text-sm opacity-75">Click "Start Camera" to begin</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        {!isCapturing ? (
          <Button onClick={startCamera} className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
            <Button onClick={capturePhoto} className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Capture Photo
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('info')}>
          Back
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Confirm Enrollment</h3>
        <p className="text-sm text-gray-600">Review the information and photo before enrolling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Info */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-gray-600">Name</Label>
            <p className="text-lg font-medium">{formData.name}</p>
          </div>
          
          {formData.department && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Department</Label>
              <p>{formData.department}</p>
            </div>
          )}
          
          {formData.email && (
            <div>
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p>{formData.email}</p>
            </div>
          )}
        </div>

        {/* Captured Photo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Captured Photo</Label>
          {capturedImage && (
            <Card className="overflow-hidden">
              <CardContent className="p-2">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-48 object-cover rounded"
                />
              </CardContent>
            </Card>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={retakePhoto}
            className="w-full"
          >
            Retake Photo
          </Button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('photo')}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={enrollEmployee.isPending}
          className="flex items-center gap-2"
        >
          {enrollEmployee.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enrolling...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enroll Employee
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add New Employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Employee
            <span className="text-sm font-normal text-gray-500">
              ({step === 'info' ? 'Step 1' : step === 'photo' ? 'Step 2' : 'Step 3'} of 3)
            </span>
          </DialogTitle>
        </DialogHeader>

        {step === 'info' && renderInfoStep()}
        {step === 'photo' && renderPhotoStep()}
        {step === 'confirm' && renderConfirmStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog; 