import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "colored";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-20 h-20"
};

const Logo = ({ className, size = "lg", variant = "colored" }: LogoProps) => {
  // For debugging, let's try multiple image paths
  const testImageLoad = (e: any) => {
    console.log('Testing image load from:', e.target.src);
  };

  const testImageError = (e: any) => {
    console.error('Image failed to load from:', e.target.src);
  };

  if (variant === "white") {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
        <img 
          src="/android-chrome-512x512.png"
          alt="ITScence Logo" 
          className="w-full h-full object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
          onLoad={testImageLoad}
          onError={testImageError}
        />
      </div>
    );
  }

  // Default and colored variants - just show the logo without any background
  return (
    <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
      <img 
        src="/android-chrome-512x512.png"
        alt="ITScence Logo" 
        className="w-full h-full object-contain"
        onLoad={testImageLoad}
        onError={testImageError}
      />
    </div>
  );
};

export default Logo; 