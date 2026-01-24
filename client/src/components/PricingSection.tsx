import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function PricingSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Simple, transparent pricing for everyone.
        </p>
        {/* Add pricing cards or details here */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Example Pricing Card */}
          <div className="rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Basic</h3>
            <p className="mt-4 text-4xl font-bold">$9</p>
            <p className="text-muted-foreground">per month</p>
            <ul className="mt-6 space-y-2 text-left text-muted-foreground">
              <li>Feature A</li>
              <li>Feature B</li>
            </ul>
            <Button asChild className="mt-8 w-full">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
          {/* More pricing cards */}
        </div>
      </div>
    </section>
  );
}
