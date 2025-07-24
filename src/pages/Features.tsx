import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Hexagon, 
  ArrowLeft, 
  TestTube, 
  FolderOpen, 
  Play, 
  BarChart3, 
  Calendar, 
  Layers,
  Users,
  Shield,
  Zap,
  Globe,
  Download,
  Bell,
  Settings,
  CheckCircle
} from 'lucide-react';
import Card from '../components/UI/Card';

const Features: React.FC = () => {
  const features = [
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Create, organize, and manage multiple testing projects with advanced filtering and search capabilities.',
      benefits: ['Unlimited projects', 'Advanced search', 'Status tracking', 'Team collaboration']
    },
    {
      icon: TestTube,
      title: 'Test Case Management',
      description: 'Comprehensive test case creation with step-by-step instructions, shared steps, and priority management.',
      benefits: ['Detailed test steps', 'Shared components', 'Priority levels', 'Tag system']
    },
    {
      icon: Layers,
      title: 'Shared Steps',
      description: 'Reusable test components that can be shared across multiple test cases for efficiency.',
      benefits: ['Reusable components', 'Version control', 'Usage tracking', 'Easy maintenance']
    },
    {
      icon: Play,
      title: 'Test Execution',
      description: 'Execute tests with real-time tracking, result recording, and comprehensive execution history.',
      benefits: ['Real-time tracking', 'Result recording', 'Execution history', 'Environment tracking']
    },
    {
      icon: Calendar,
      title: 'Test Plans',
      description: 'Create and manage test plans with scheduling, progress tracking, and team assignments.',
      benefits: ['Schedule management', 'Progress tracking', 'Team assignments', 'Milestone tracking']
    },
    {
      icon: BarChart3,
      title: 'Advanced Reporting',
      description: 'Generate detailed reports with charts, trends, and export capabilities in multiple formats.',
      benefits: ['PDF/CSV export', 'Custom charts', 'Trend analysis', 'Scheduled reports']
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user support with role-based access control and real-time collaboration features.',
      benefits: ['Role-based access', 'Real-time updates', 'Team notifications', 'Activity tracking']
    },
    {
      icon: Shield,
      title: 'Security & Compliance',
      description: 'Enterprise-grade security with audit trails, data encryption, and compliance reporting.',
      benefits: ['Data encryption', 'Audit trails', 'Compliance reports', 'Secure access']
    },
    {
      icon: Zap,
      title: 'Automation Integration',
      description: 'Seamless integration with popular automation tools and CI/CD pipelines.',
      benefits: ['CI/CD integration', 'API access', 'Webhook support', 'Tool connectors']
    },
    {
      icon: Globe,
      title: 'Multi-Platform Support',
      description: 'Cross-platform testing support with browser, mobile, and API testing capabilities.',
      benefits: ['Browser testing', 'Mobile support', 'API testing', 'Cross-platform']
    },
    {
      icon: Download,
      title: 'Data Export',
      description: 'Export your data in various formats with customizable templates and scheduling options.',
      benefits: ['Multiple formats', 'Custom templates', 'Scheduled exports', 'Bulk operations']
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Intelligent notification system with customizable alerts and real-time updates.',
      benefits: ['Custom alerts', 'Real-time updates', 'Email notifications', 'Mobile alerts']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Hexagon className="w-8 h-8 text-cyan-400 fill-cyan-400/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-20 rounded-lg blur-sm"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                SMARTQA
              </span>
            </div>

            <nav className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="flex items-center text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-cyan-400 transition-colors font-medium"
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover all the advanced capabilities that make SMARTQA the ultimate 
            testing management platform for modern development teams.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} gradient hover className="p-6 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg mr-4">
                    <feature.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                
                <p className="text-gray-300 mb-6 flex-grow">{feature.description}</p>
                
                <div className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Integration Section */}
        <div className="mt-20">
          <Card gradient className="p-12 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready for Enterprise Integration
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                SMARTQA is designed to integrate seamlessly with your existing workflow tools 
                and enterprise systems for maximum productivity.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-gray-300 font-medium">Jira</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-300 font-medium">Azure DevOps</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-gray-300 font-medium">Asana</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <Settings className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-gray-300 font-medium">Slack</p>
                </div>
              </div>

              <Link 
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
              >
                Start Your Free Trial
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Features;