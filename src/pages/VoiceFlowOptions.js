import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Palette, Code, Zap, ArrowRight } from 'lucide-react';

function VoiceFlowOptions() {
  const navigate = useNavigate();

  const options = [
    {
      id: 'native',
      title: 'Native VoiceFlow Widget',
      description: 'Complete VoiceFlow interface with zero customization needed',
      pros: ['✅ Zero setup time', '✅ All features included', '✅ Auto-updates'],
      cons: ['❌ Fixed appearance', '❌ Limited customization'],
      route: '/native-chat',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-green-400 to-green-600',
      badge: 'FASTEST'
    },
    {
      id: 'custom',
      title: 'Custom UI + VoiceFlow SDK',
      description: 'Your beautiful interface powered by VoiceFlow technology',
      pros: ['✅ Full UI control', '✅ VoiceFlow voice tech', '✅ Brand consistent'],
      cons: ['⚠️ More complex setup', '⚠️ SDK limitations'],
      route: '/custom-chat',
      demoRoute: '/custom-demo',
      icon: <Palette className="w-8 h-8" />,
      color: 'from-purple-400 to-purple-600',
      badge: 'RECOMMENDED'
    },
    {
      id: 'api',
      title: 'VoiceFlow API Integration',
      description: 'Maximum control using VoiceFlow API with custom voice handling',
      pros: ['✅ Complete flexibility', '✅ ElevenLabs audio', '✅ Your existing UI'],
      cons: ['⚠️ More development work', '⚠️ Voice setup required'],
      route: '/api-chat',
      icon: <Code className="w-8 h-8" />,
      color: 'from-blue-400 to-blue-600',
      badge: 'FLEXIBLE'
    },
    {
      id: 'current',
      title: 'Your Current Implementation',
      description: 'Custom browser speech recognition (your 20-hour solution)',
      pros: ['✅ Complete control', '✅ Learning experience'],
      cons: ['❌ Browser compatibility', '❌ Complex maintenance', '❌ Reliability issues'],
      route: '/chat',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-gray-400 to-gray-600',
      badge: 'EDUCATIONAL'
    }
  ];

  return (
    <div 
      className="min-h-screen py-12"
      style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 25%, #45b7d1 50%, #96ceb4 75%, #ffeaa7 100%)',
        animation: 'gradient-shift 3s ease infinite'
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Choose Your VoiceFlow Integration
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Same flawless voice technology, different levels of UI customization
          </p>
          <div className="bg-white rounded-lg p-4 max-w-2xl mx-auto shadow-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Pro Tip:</strong> All options use the same VoiceFlow conversation flow and ElevenLabs voice you tested. 
              The difference is how much control you want over the interface.
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {options.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 relative overflow-hidden hover:transform hover:scale-105 transition-all duration-300"
            >
              {/* Badge */}
              <div className={`absolute top-4 right-4 bg-gradient-to-r ${option.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                {option.badge}
              </div>

              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-full flex items-center justify-center text-white mb-6`}>
                {option.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {option.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {option.description}
              </p>

              {/* Pros */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Advantages:</h4>
                <ul className="space-y-1">
                  {option.pros.map((pro, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Considerations:</h4>
                <ul className="space-y-1">
                  {option.cons.map((con, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      {con}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate(option.route)}
                  className={`w-full bg-gradient-to-r ${option.color} text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2`}
                >
                  <span>Try This Option</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                {/* Demo button for Custom UI option */}
                {option.demoRoute && (
                  <button
                    onClick={() => navigate(option.demoRoute)}
                    className="w-full bg-white border-2 border-purple-400 text-purple-600 font-semibold py-2 px-6 rounded-xl hover:bg-purple-50 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>👀 See Working Demo</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl border border-pink-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Quick Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-green-600">Native Widget</th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-600">Custom UI + SDK</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-600">API Integration</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Your Current</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Setup Time</td>
                  <td className="text-center py-3 px-4">1 minute</td>
                  <td className="text-center py-3 px-4">30 minutes</td>
                  <td className="text-center py-3 px-4">2 hours</td>
                  <td className="text-center py-3 px-4">20 hours</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">UI Customization</td>
                  <td className="text-center py-3 px-4">❌ None</td>
                  <td className="text-center py-3 px-4">✅ High</td>
                  <td className="text-center py-3 px-4">✅ Complete</td>
                  <td className="text-center py-3 px-4">✅ Complete</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Voice Quality</td>
                  <td className="text-center py-3 px-4">✅ Perfect</td>
                  <td className="text-center py-3 px-4">✅ Perfect</td>
                  <td className="text-center py-3 px-4">✅ Perfect</td>
                  <td className="text-center py-3 px-4">⚠️ Variable</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Mobile Support</td>
                  <td className="text-center py-3 px-4">✅ Native</td>
                  <td className="text-center py-3 px-4">✅ Good</td>
                  <td className="text-center py-3 px-4">✅ Good</td>
                  <td className="text-center py-3 px-4">⚠️ Complex</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">Maintenance</td>
                  <td className="text-center py-3 px-4">✅ Zero</td>
                  <td className="text-center py-3 px-4">⚠️ Low</td>
                  <td className="text-center py-3 px-4">⚠️ Medium</td>
                  <td className="text-center py-3 px-4">❌ High</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-12 text-center">
          <div className="bg-purple-100 border border-purple-300 rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-purple-800 mb-2">
              🎯 Our Recommendation
            </h3>
            <p className="text-purple-700">
              Start with <strong>Custom UI + VoiceFlow SDK</strong> for the perfect balance of 
              your beautiful interface with VoiceFlow's reliable voice technology.
              You get professional results without the complexity!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceFlowOptions;
