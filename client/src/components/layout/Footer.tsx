export const Footer = () => (
  <footer className="border-t border-border bg-background-secondary">
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 text-sm text-text-secondary md:grid-cols-3 md:px-12">
      <div className="space-y-2">
        <p className="font-serif uppercase tracking-[0.3em]">Desert Modern</p>
        <p>
          Minimal routines for body, home, and travel. Designed with warm tones,
          clear language, and a quiet checkout flow.
        </p>
      </div>
      <div className="space-y-2">
        <p className="font-heading text-base text-text-primary">Support</p>
        <p>Email confirmations, password resets, and order tracking are handled through the API integration layer.</p>
      </div>
      <div className="space-y-2">
        <p className="font-heading text-base text-text-primary">Build Notes</p>
        <p>React, TypeScript, Tailwind, Zustand, Express, MongoDB, Stripe, Cloudinary, and Nodemailer.</p>
      </div>
    </div>
  </footer>
);
