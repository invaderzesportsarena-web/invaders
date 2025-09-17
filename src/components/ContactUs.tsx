import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ContactUs() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Contact Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-110 shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      {/* Contact Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-text-primary">
              Contact Us
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Need Help?
              </h3>
              
              <p className="text-text-secondary mb-6">
                In case of any issue or query, kindly feel free to contact us at WhatsApp:
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-secondary/20 rounded-xl border border-border">
                  <div className="flex items-center justify-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary text-lg">03390024828</span>
                  </div>
                </div>
                
                <div className="p-4 bg-secondary/20 rounded-xl border border-border">
                  <div className="flex items-center justify-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary text-lg">03102193828</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="px-8"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}