import { Accordion } from "@heroui/react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Does this replace our existing bookkeeping?",
    a: "It's built to match the same ledger format your accountant already uses — invoice numbers, payment modes, GST split and all — so it formalizes the existing process rather than replacing it with something unfamiliar.",
  },
  {
    q: "Who can create staff accounts?",
    a: "Only an admin, from Settings → Team Management. Signing in with Google links to an account an admin already created — it isn't an open self-serve signup, to keep financial data restricted to your team.",
  },
  {
    q: "Can I still export to Excel?",
    a: "Yes — Payment Report and Service Tax Report exports are unchanged, and Vendor and Cash modules ship with their own exports in the same column layout.",
  },
  {
    q: "Is GST calculated automatically?",
    a: "Yes. Profit is treated as inclusive of 18% GST and split into 9% CGST + 9% SGST automatically on both the client and vendor side of every booking.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Frequently asked questions</h2>
        </div>

        <Accordion>
          {FAQS.map((item, i) => (
            <Accordion.Item key={item.q} id={`faq-${i}`}>
              <Accordion.Heading>
                <Accordion.Trigger className="flex items-center justify-between w-full py-5 text-left font-semibold text-slate-800 dark:text-white">
                  {item.q}
                  <Accordion.Indicator>
                    <ChevronDown size={18} />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="pb-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.a}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
