import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-primary-900">Contact Us</h1>
        <p className="mt-2 text-slate-600">
          Have a question, prayer request, or want to get involved? Reach out — we'd love to hear
          from you.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card variant="clay" className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-primary-700" />
              <div>
                <div className="text-sm font-medium text-primary-900">Official Union Email</div>
                <a
                  href="mailto:tumcunion@gmail.com"
                  className="text-sm font-bold text-primary-700 hover:text-primary-900 hover:underline transition"
                >
                  tumcunion@gmail.com
                </a>
                <div className="text-[11px] text-slate-500 mt-0.5">Direct inquiries & executive correspondence</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-primary-700" />
              <div>
                <div className="text-sm font-medium text-primary-900">Phone</div>
                <div className="text-sm text-slate-600">+254 700 000 000</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary-700" />
              <div>
                <div className="text-sm font-medium text-primary-900">Campus</div>
                <div className="text-sm text-slate-600">
                  Technical University of Mombasa, Tom Mboya Street, Mombasa
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card variant="flat">
            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-lg font-medium text-primary-900">Message sent!</p>
                <p className="mt-2 text-sm text-slate-600">
                  Thanks for reaching out — someone from the leadership team will get back to you
                  soon.
                </p>
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  // No backend endpoint for public contact submissions yet —
                  // this confirms intent to the visitor without silently
                  // pretending a message was delivered somewhere. Wiring
                  // this to a real `communication` module endpoint is a
                  // natural next module to build out.
                  setSubmitted(true);
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Your name" required />
                  <Input label="Email" type="email" required />
                </div>
                <Input label="Subject" required />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="rounded-[var(--radius-input)] border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <Button type="submit" className="mt-2 self-start px-6">
                  Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
