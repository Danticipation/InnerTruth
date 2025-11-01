import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Twitter, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">Mirror</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered personality analysis for deeper self-understanding and growth.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">How It Works</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get insights and tips for self-discovery
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter email" 
                className="text-sm"
                data-testid="input-newsletter-email"
              />
              <Button size="icon" data-testid="button-subscribe">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Mirror. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" data-testid="button-social-twitter">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-social-linkedin">
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-social-github">
              <Github className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
