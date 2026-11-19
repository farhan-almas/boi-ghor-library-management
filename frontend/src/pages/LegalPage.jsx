import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, ShieldCheck } from 'lucide-react';

const content = {
  terms: {
    eyebrow: 'Terms of Service',
    title: 'Simple terms for a shared library.',
    intro: 'These terms explain how to use BOI GHOR responsibly and help keep the catalogue available for every reader.',
    sections: [
      ['Account use', 'Keep your login details private and use your own account when borrowing, saving, or managing books.'],
      ['Borrowing and returns', 'Return books by their due dates. Any overdue fines shown in the app are part of the library’s lending policy.'],
      ['Respectful use', 'Do not attempt to disrupt the service, alter other users’ information, or use administrator functions without permission.'],
    ],
  },
  privacy: {
    eyebrow: 'Privacy Policy',
    title: 'Your reading information stays private.',
    intro: 'BOI GHOR uses only the information required to provide your library account and manage loans.',
    sections: [
      ['Information we keep', 'Your name, email address, optional phone number, borrowing records, saved books, and payment history.'],
      ['How it is used', 'This information is used to authenticate your account, track loans and returns, show reading insights, and process demo fine payments.'],
      ['Your control', 'Contact the library administrator if you need help correcting account information or have a question about your data.'],
    ],
  },
};

export default function LegalPage({ type }) {
  const page = content[type] || content.terms;
  return <main className="min-h-screen bg-brand-50 px-4 py-10"><div className="card mx-auto max-w-2xl p-6 md:p-10">
    <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={16} /> Back to sign in</Link>
    <div className="mb-7 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={20} /></div><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Boi Ghor</p><h1 className="page-title text-2xl font-bold text-gray-800">{page.eyebrow}</h1></div></div>
    <h2 className="page-title text-3xl font-bold text-gray-800">{page.title}</h2><p className="mt-3 leading-relaxed text-gray-500">{page.intro}</p>
    <div className="mt-8 space-y-6">{page.sections.map(([heading, text]) => <section key={heading} className="border-l-2 border-brand-500 pl-4"><h3 className="font-semibold text-gray-800">{heading}</h3><p className="mt-1 text-sm leading-relaxed text-gray-500">{text}</p></section>)}</div>
    <div className="mt-9 flex items-center gap-2 rounded-xl bg-brand-50 p-4 text-sm text-brand-700"><ShieldCheck size={18} className="shrink-0" />For this local project, data stays in your own local database.</div>
  </div></main>;
}
