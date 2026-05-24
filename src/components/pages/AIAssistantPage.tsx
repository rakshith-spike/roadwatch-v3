import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Mic,
  Paperclip,
  Sparkles,
  MapPin,
  AlertCircle,
  TrendingUp,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Lightbulb,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: { label: string; icon: typeof MapPin }[];
}

const suggestedPrompts = [
  { icon: AlertCircle, text: 'Show me critical issues in my area' },
  { icon: TrendingUp, text: 'What are the trending complaint types?' },
  { icon: MapPin, text: 'Find nearest repair work in progress' },
  { icon: BarChart3, text: 'Show analytics for this month' },
  { icon: FileText, text: 'Help me file a new complaint' },
  { icon: HelpCircle, text: 'How does the complaint process work?' }
];

export function AIAssistantPage() {
  const { user, complaints } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋 I'm ROAD-WATCH AI Assistant, here to help you with:\n\n• Filing and tracking complaints\n• Finding information about road issues\n• Understanding repair status and timelines\n• Getting insights and analytics\n\nHow can I assist you today?`,
      timestamp: new Date(),
      actions: [
        { label: 'Report Issue', icon: AlertCircle },
        { label: 'Track Complaint', icon: FileText },
        { label: 'View Map', icon: MapPin }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = getAIResponse(inputValue.toLowerCase());
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses.content,
        timestamp: new Date(),
        actions: responses.actions
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (query: string): { content: string; actions?: Message['actions'] } => {
    if (query.includes('critical') || query.includes('urgent')) {
      return {
        content: `Based on current data, there are **${complaints.filter(c => c.severity === 'critical').length} critical issues** in your region:\n\n1. **Large Pothole on MG Road** - Critical severity, affecting traffic\n2. **Drainage Overflow** - High risk during monsoon\n\nThese issues have high priority scores and are being fast-tracked for resolution. Would you like me to show these on the map or provide more details?`,
        actions: [
          { label: 'View on Map', icon: MapPin },
          { label: 'Get Details', icon: FileText }
        ]
      };
    }

    if (query.includes('file') || query.includes('report') || query.includes('complaint')) {
      return {
        content: `I can help you file a new complaint! Here's the process:\n\n**Step 1:** Describe the issue (pothole, street light, drainage, etc.)\n**Step 2:** Add photos or videos for faster processing\n**Step 3:** Confirm your location (I can auto-detect)\n**Step 4:** Submit and receive tracking ID\n\n🤖 **AI Features:**\n• Auto-categorization of your issue\n• Severity assessment\n• Duplicate detection\n• Estimated resolution time\n\nShall I start the complaint process now?`,
        actions: [
          { label: 'Start Filing', icon: AlertCircle },
          { label: 'View Examples', icon: FileText }
        ]
      };
    }

    if (query.includes('status') || query.includes('track')) {
      return {
        content: `Here's the status of your recent complaints:\n\n📋 **C001 - Pothole on MG Road**\n• Status: In Progress (65% complete)\n• Assigned to: Kumar Infrastructure\n• Expected completion: Jan 25, 2024\n\n📋 **C002 - Street Light Issue**\n• Status: Assigned\n• Contractor notified: 2 hours ago\n\nWould you like me to send you updates when there's progress?`,
        actions: [
          { label: 'Enable Notifications', icon: AlertCircle },
          { label: 'View All', icon: FileText }
        ]
      };
    }

    if (query.includes('analytics') || query.includes('statistics') || query.includes('trending')) {
      return {
        content: `📊 **Analytics Summary - This Month:**\n\n• Total Complaints: ${complaints.length}\n• Resolution Rate: 82%\n• Avg Response Time: 4.2 days\n• Most Common: Potholes (42%)\n\n**Trending Issues:**\n1. Potholes (↑ 15%)\n2. Drainage (↑ 8%)\n3. Street Lights (↓ 5%)\n\n**AI Prediction:** Expect 20% more drainage complaints next week due to forecasted rain.\n\nNeed detailed charts or specific district data?`,
        actions: [
          { label: 'View Charts', icon: BarChart3 },
          { label: 'Export Report', icon: FileText }
        ]
      };
    }

    if (query.includes('how') || query.includes('process') || query.includes('work')) {
      return {
        content: `Here's how ROAD-WATCH complaint resolution works:\n\n**1. Report** 📝\nCitizen files complaint with photos/location\n\n**2. AI Analysis** 🤖\nAutomatic categorization, severity assessment, duplicate check\n\n**3. Verification** ✅\nGovernment admin verifies the complaint\n\n**4. Assignment** 👷\nContractor assigned based on location & expertise\n\n**5. Resolution** 🔧\nContractor repairs and uploads evidence\n\n**6. Closure** ✨\nAdmin verifies, citizen rates the work\n\n**Average Timeline:** 5-10 days for standard issues\n\nAny specific step you'd like to know more about?`,
        actions: [
          { label: 'File Complaint', icon: AlertCircle },
          { label: 'View FAQ', icon: HelpCircle }
        ]
      };
    }

    return {
      content: `I understand you're asking about "${query}". Here's what I can help with:\n\n• **Report Issues:** File new complaints with AI assistance\n• **Track Status:** Check your complaint progress\n• **Find Information:** Road conditions, nearby issues\n• **Get Analytics:** Statistics and trends\n• **Understand Process:** How the system works\n\nCould you please be more specific about what you'd like to know?`,
      actions: [
        { label: 'Report Issue', icon: AlertCircle },
        { label: 'View Map', icon: MapPin }
      ]
    };
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
              <p className="text-surface-400">Powered by ROAD-WATCH Intelligence</p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <Card variant="gradient" className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-surface-400">ROAD-WATCH AI</span>
                      </div>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-800/80 text-surface-200'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      
                      {message.actions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.actions.map((action, i) => (
                            <button
                              key={i}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-700/50 hover:bg-surface-700 rounded-lg text-xs text-white transition-colors"
                            >
                              <action.icon className="w-3.5 h-3.5" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2 ml-2">
                        <button className="p-1 text-surface-500 hover:text-surface-300">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-surface-500 hover:text-surface-300">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-surface-500 hover:text-surface-300">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-surface-500 hover:text-surface-300">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-1 px-4 py-3 bg-surface-800/80 rounded-2xl">
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-surface-700/50">
            <div className="flex items-center gap-3">
              <button className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about road infrastructure..."
                className="flex-1 bg-surface-800/50 border border-surface-700 rounded-xl px-4 py-3 text-white placeholder-surface-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <Button onClick={handleSend} disabled={!inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Side Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex-shrink-0 space-y-4"
      >
        {/* Suggested Prompts */}
        <Card variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-warning-400" />
            <h3 className="font-semibold text-white">Suggested Prompts</h3>
          </div>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handlePromptClick(prompt.text)}
                className="w-full flex items-center gap-3 p-3 bg-surface-800/50 hover:bg-surface-800 rounded-lg text-left transition-colors"
              >
                <prompt.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-sm text-surface-300">{prompt.text}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* AI Capabilities */}
        <Card variant="gradient">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h3 className="font-semibold text-white">AI Capabilities</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mt-2" />
              <p className="text-surface-300">Natural language complaint filing</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mt-2" />
              <p className="text-surface-300">Real-time status tracking</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mt-2" />
              <p className="text-surface-300">Predictive analytics insights</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mt-2" />
              <p className="text-surface-300">Multi-language support</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mt-2" />
              <p className="text-surface-300">Voice input capability</p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card variant="gradient">
          <h3 className="font-semibold text-white mb-4">Your Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-surface-800/50 rounded-lg">
              <p className="text-xl font-bold text-primary-400">{complaints.length}</p>
              <p className="text-xs text-surface-400">Complaints</p>
            </div>
            <div className="text-center p-3 bg-surface-800/50 rounded-lg">
              <p className="text-xl font-bold text-accent-400">82%</p>
              <p className="text-xs text-surface-400">Resolved</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
