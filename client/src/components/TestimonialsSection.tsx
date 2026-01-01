import React from 'react';

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What Our Users Say</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Hear from people who have transformed their lives with InnerTruth.
        </p>
        {/* Add testimonial cards or carousel here */}
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Example Testimonial Card */}
          <div className="rounded-lg border p-6 shadow-sm bg-background text-left">
            <p className="text-muted-foreground italic">
              "InnerTruth has helped me understand myself better than ever before. Highly recommend!"
            </p>
            <p className="mt-4 font-semibold">- Jane Doe</p>
          </div>
          {/* More testimonial cards */}
        </div>
      </div>
    </section>
  );
}
