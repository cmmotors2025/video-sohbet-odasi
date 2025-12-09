import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, MoreVertical, Plus, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if in standalone mode (already installed as PWA)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) {
      setIsInstalled(true);
    }

    // Detect iOS device
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Detect Safari browser (not Chrome, Firefox etc on iOS)
    const isSafariBrowser = /^((?!chrome|android|crios|fxios|opera).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);

    // Listen for install prompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // iOS but not Safari - show warning
  const isNonSafariIOS = isIOS && !isSafari;

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-surface border-border/50">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">Zaten Yüklü!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Birlikte İzle uygulaması cihazınıza yüklü.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Uygulamaya Git
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-surface border-border/50">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-xl text-foreground">Uygulamayı Yükle</CardTitle>
          <CardDescription className="text-muted-foreground">
            Birlikte İzle'yi ana ekranına ekleyerek tam ekran deneyimin tadını çıkar!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* iOS but NOT Safari - Show warning */}
          {isNonSafariIOS && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong>Safari Kullan!</strong> iOS'ta uygulama yüklemek için Safari tarayıcısını kullanman gerekiyor. 
                Bu sayfayı Safari'de aç.
              </AlertDescription>
            </Alert>
          )}

          {deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Yükle
            </Button>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {isSafari ? "Safari'de yüklemek için:" : "Önce Safari'de bu sayfayı aç, sonra:"}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share className="w-5 h-5 text-primary" />
                    <p className="text-sm text-foreground">
                      Alt menüden <strong>Paylaş</strong> butonuna tıkla
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    <p className="text-sm text-foreground">
                      <strong>"Ana Ekrana Ekle"</strong> seçeneğine tıkla
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <p className="text-sm text-foreground">
                    Sağ üstten <strong>"Ekle"</strong> butonuna tıkla
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Android cihazlarda yüklemek için:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <MoreVertical className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">
                    1. Tarayıcı menüsünü aç (⋮)
                  </p>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">
                    2. <strong>"Uygulamayı yükle"</strong> veya <strong>"Ana ekrana ekle"</strong> seç
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            className="w-full"
          >
            Tarayıcıda Devam Et
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
