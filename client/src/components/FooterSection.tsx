import React from 'react';

export function FooterSection() {
  return (
    <footer className="bg-card py-10 text-center text-muted-foreground">
      <div className="mx-auto max-w-5xl px-6">
        <p>&copy; {new Date().getFullYear()} InnerTruth. All rights reserved.</p>
        <div className="mt-4 flex justify-center space-x-4">
          <a href="#" className="hover:text-primary">Privacy Policy</a>
          <a href="#" className="hover:text-primary">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
