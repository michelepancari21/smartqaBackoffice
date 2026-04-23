import React from 'react';
import { BookOpen, ExternalLink, FileText, Code, HelpCircle } from 'lucide-react';
import Card from '../components/UI/Card';

const sections = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of SmartQA and set up your first project.',
    icon: BookOpen,
  },
  {
    title: 'Test Cases',
    description: 'Create, organize, and manage your test cases with folders and tags.',
    icon: FileText,
  },
  {
    title: 'Test Runs & Plans',
    description: 'Execute test runs, track results, and build comprehensive test plans.',
    icon: Code,
  },
  {
    title: 'API & Automation',
    description: 'Integrate SmartQA with your CI/CD pipeline and automation tools.',
    icon: ExternalLink,
  },
];

const Documentation: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documentation</h1>
        <p className="mt-2 text-slate-600 dark:text-gray-400">
          Guides and references to help you get the most out of SmartQA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{section.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{section.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
        <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Need more help?</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Contact your team administrator or reach out to support for assistance.
        </p>
      </div>
    </div>
  );
};

export default Documentation;
