import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (code: string) => void;
  title?: string;
}

export function QRScanner({ isOpen, onClose, onScanComplete, title = "QR-Code scannen" }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Rückkamera bevorzugen
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setHasCamera(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  const handleManualInput = () => {
    const code = prompt("Einladungscode manuell eingeben:");
    if (code) {
      onScanComplete(code);
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasCamera ? (
            <>
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-gray-900 rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                    QR-Code in den Rahmen halten
                  </p>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <Camera className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Kamera verwenden um QR-Code zu scannen
                      </p>
                      <Button onClick={startScanning} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Kamera starten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <X className="h-12 w-12 mx-auto text-red-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Kamera nicht verfügbar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualInput}
              className="flex-1"
              data-testid="manual-input-button"
            >
              Code eingeben
            </Button>
            {isScanning && (
              <Button
                variant="ghost"
                onClick={stopScanning}
                data-testid="stop-scanning-button"
              >
                Stoppen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}