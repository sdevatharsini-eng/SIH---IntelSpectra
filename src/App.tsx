import React, { useState, useEffect } from 'react';
import { Search, CloudLightning as Lightning, Shield, Eye, Users, Phone, Menu, X, ChevronRight, Zap, Search as SearchIcon, Activity, Target, Brain } from 'lucide-react';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const mockThreats = [
    { id: 1, type: 'Person', confidence: 96.7, status: 'Tracking', color: 'green' },
    { id: 2, type: 'Weapons', confidence: 89.2, status: 'Detected', color: 'blue' },
    { id: 3, type: 'Bag', confidence: 78.5, status: 'Suspicious', color: 'red' },
    { id: 4, type: 'Vehicle', confidence: 92.1, status: 'Identified', color: 'green' }
  ];

  const navigationLinks = ['Home', 'Features', 'Technology', 'Case Studies', 'Team', 'Contact'];

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-green-500/10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 191, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translate(${animationFrame % 50}px, ${animationFrame % 50}px)`
          }}
        />
      </div>

      {/* Header Navigation */}
      <header className="relative z-50 backdrop-blur-md bg-gray-900/80 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                IntelSpectra
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 text-sm font-medium"
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* Search and CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-300 hover:text-cyan-400 transition-colors duration-200">
                <Search className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors duration-200">
                LIVE
              </button>
              <button className="px-4 py-2 border border-green-500 text-green-400 hover:bg-green-500 hover:text-gray-900 rounded-lg font-medium transition-colors duration-200">
                UPLOAD VIDEO
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-cyan-400"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-gray-900 border-b border-cyan-500/20 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              {navigationLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-gray-300 hover:text-cyan-400 transition-colors duration-200"
                >
                  {link}
                </a>
              ))}
              <div className="pt-4 flex space-x-3">
                <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium">
                  LIVE
                </button>
                <button className="px-4 py-2 border border-green-500 text-green-400 hover:bg-green-500 hover:text-gray-900 rounded-lg font-medium">
                  UPLOAD VIDEO
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-green-400 bg-clip-text text-transparent">
                  INTELLIGENCE
                </span>
                <br />
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                  SPECTRUM
                </span>
                <br />
                <span className="text-white">ZERO LAG</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
                AI/ML-Powered Video Intelligence Backend for Proactive Surveillance and Rapid Forensics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-cyan-500/25">
                LIVE
                <ChevronRight className="inline-block ml-2 w-5 h-5" />
              </button>
              <button className="px-8 py-4 border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-gray-900 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105">
                UPLOAD VIDEO
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">99.7%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">&lt;50ms</div>
                <div className="text-sm text-gray-400">Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-gray-400">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Threat Monitoring Panel */}
          <div className="relative">
            <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-cyan-400">Threat Monitoring</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">ACTIVE</span>
                </div>
              </div>

              {/* Mock Video Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative bg-gray-700 rounded-lg aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-green-500/20"></div>
                    <div className="absolute top-2 left-2 text-xs bg-gray-900/80 px-2 py-1 rounded">
                      CAM {i}
                    </div>
                    {/* Mock bounding boxes */}
                    <div 
                      className="absolute border-2 border-cyan-400 rounded"
                      style={{
                        top: '30%',
                        left: '25%',
                        width: '40%',
                        height: '30%',
                        animation: `pulse 2s infinite ${i * 0.5}s`
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-cyan-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
                        PERSON
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Threat List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Detection Results</h4>
                {mockThreats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full bg-${threat.color}-400`}></div>
                      <span className="text-sm">{threat.type}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">{threat.confidence}%</span>
                      <span className={`text-xs px-2 py-1 rounded bg-${threat.color}-400/20 text-${threat.color}-400`}>
                        {threat.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-400/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                Advanced Intelligence
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Harness the power of cutting-edge AI to transform your surveillance capabilities with unprecedented speed and accuracy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-cyan-400">Real-Time Predictive Edge</h3>
                <p className="text-gray-300 leading-relaxed">
                  Lightning-fast threat detection with sub-50ms response times. Our edge computing architecture processes video streams instantly, identifying potential threats before they escalate.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-green-500/20 hover:border-green-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                  <SearchIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-400">Rapid Forensic Search</h3>
                <p className="text-gray-300 leading-relaxed">
                  Advanced AI-powered search capabilities that can instantly locate specific objects, people, or events across vast video archives. Find what you need in seconds, not hours.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-blue-400">Explainable & Private</h3>
                <p className="text-gray-300 leading-relaxed">
                  Transparent AI decisions with full audit trails. Enterprise-grade security ensures your data remains private while providing clear explanations for every detection and classification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 border-t border-cyan-500/20">
        {/* Circuit Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, cyan 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, lime 2px, transparent 2px),
                linear-gradient(45deg, transparent 48%, cyan 49%, cyan 51%, transparent 52%),
                linear-gradient(-45deg, transparent 48%, lime 49%, lime 51%, transparent 52%)
              `,
              backgroundSize: '100px 100px, 100px 100px, 50px 50px, 50px 50px',
              backgroundPosition: '0 0, 50px 50px, 0 0, 25px 25px'
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-gray-900" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                  IntelSpectra
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Revolutionizing surveillance with AI-powered video intelligence. Zero lag, maximum insight.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-cyan-500 transition-colors duration-200 cursor-pointer">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-500 transition-colors duration-200 cursor-pointer">
                  <Target className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors duration-200 cursor-pointer">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Quick Links</h4>
              <div className="space-y-2">
                {navigationLinks.map((link) => (
                  <a key={link} href="#" className="block text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                    {link}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Search className="w-4 h-4" />
                  <span>info@intellispectra.ai</span>
                </div>
                <button className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-green-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-green-600 transition-all duration-200">
                  Get Demo
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-cyan-500/20 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 IntelSpectra. All rights reserved. | Powering the future of intelligent surveillance.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
