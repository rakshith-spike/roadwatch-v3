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
  HelpCircle,
  Truck,
  Wallet,
  ShieldCheck
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
  { icon: Wallet, text: 'What is the estimate for MG Road?' },
  { icon: Truck, text: 'Who is the contractor for HSR Layout road?' },
  { icon: AlertCircle, text: 'Show pending complaints and their severity' },
  { icon: MapPin, text: 'Give me details for Koramangala road work' },
  { icon: BarChart3, text: 'Compare budget allocated and spent' },
  { icon: ShieldCheck, text: 'Which authority handles drainage complaints?' }
];

const formatMoney = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function statusLabel(value: string) {
  return value.replace(/_/g, ' ');
}

const queryStopWords = new Set([
  'what', 'which', 'where', 'when', 'who', 'whom', 'whose', 'is', 'are', 'was', 'were',
  'the', 'for', 'and', 'or', 'to', 'of', 'in', 'on', 'me', 'show', 'give', 'tell',
  'road', 'roads', 'work', 'project', 'details', 'status', 'estimate', 'estimated',
  'budget', 'cost', 'spent', 'contractor', 'constructor'
]);

function queryTokens(query: string) {
  return normalize(query)
    .split(' ')
    .filter((word) => word.length > 2 && !queryStopWords.has(word));
}

export function AIAssistantPage() {
  const { user, complaints, projects, contractors, budgetEntries, setCurrentView } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I'm ROAD-WATCH AI Assistant. Ask me about any road, contractor, complaint, estimate, budget, spend, authority routing, work progress, or repair history in this prototype.\n\nTry: "What is the estimate for MG Road?", "Who is contractor for HSR Layout?", or "Show pending pothole complaints."`,
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
      const responses = getAIResponse(inputValue);
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

  const findProject = (query: string) => {
    const tokens = queryTokens(query);
    const scored = projects.map((project) => {
      const haystack = normalize(`${project.id} ${project.title} ${project.description} ${project.location.address} ${project.location.district}`);
      const exactTitle = haystack.includes(normalize(query)) ? 10 : 0;
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), exactTitle);
      return { project, score };
    }).sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].project : undefined;
  };

  const findComplaint = (query: string) => {
    const tokens = queryTokens(query);
    const scored = complaints.map((complaint) => {
      const haystack = normalize(`${complaint.id} ${complaint.title} ${complaint.description} ${complaint.category} ${complaint.location.address}`);
      const idMatch = normalize(query).includes(normalize(complaint.id)) ? 10 : 0;
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), idMatch);
      return { complaint, score };
    }).sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].complaint : undefined;
  };

  const projectAnswer = (project: typeof projects[number]) => {
    const contractor = contractors.find((item) => item.id === project.contractor);
    const linkedComplaints = complaints.filter((complaint) => project.complaints.includes(complaint.id));
    const projectBudgets = budgetEntries.filter((entry) => entry.projectId === project.id);
    const pendingBudget = projectBudgets.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + entry.amount, 0);
    const lastLog = project.workLogs?.[project.workLogs.length - 1];

    return `Here are the details I found for **${project.title}**:\n\n` +
      `• Road/location: ${project.location.address}, ${project.location.district}\n` +
      `• Road type: **${project.roadType}**, last relayed on ${project.lastRelayingDate}\n` +
      `• Responsible authority: ${project.responsibleAuthority}\n` +
      `• Executive Engineer: ${project.executiveEngineer}\n` +
      `• Status: ${statusLabel(project.status)} at ${project.progress}% progress\n` +
      `• Estimated / sanctioned budget: **${formatMoney(project.budget)}**\n` +
      `• Amount spent so far: **${formatMoney(project.spent)}** (${Math.round((project.spent / project.budget) * 100)}%)\n` +
      `• Budget source: ${project.budgetSource}\n` +
      `• Road quality score: ${project.qualityScore || 'Not recorded'}/100\n` +
      `• Remaining balance: **${formatMoney(project.budget - project.spent)}**\n` +
      `• Contractor: **${contractor?.company || project.contractorName || project.contractor}**${contractor ? `, license ${contractor.license}, rating ${contractor.rating}/5` : ''}\n` +
      `• Approved by: ${project.approvedBy || 'Not recorded'}\n` +
      `• Timeline: ${project.startDate} to ${project.endDate}\n` +
      `• Linked complaints: ${linkedComplaints.length ? linkedComplaints.map((complaint) => `${complaint.id} (${complaint.severity}, ${statusLabel(complaint.status)})`).join(', ') : 'None'}\n` +
      `• Pending budget requests: ${pendingBudget ? formatMoney(pendingBudget) : 'None'}\n` +
      `• Latest work update: ${lastLog ? `${lastLog.date} - ${lastLog.description}` : 'No work log uploaded yet'}\n\n` +
      `Transparency note: citizens can inspect contractor responsibility, spend, progress and linked complaint history for this road.`;
  };

  const complaintAnswer = (complaint: typeof complaints[number]) => {
    const relatedProject = projects.find((project) => project.complaints.includes(complaint.id));
    const assignedContractor = contractors.find((contractor) => contractor.id === complaint.assignedTo);

    return `Complaint **${complaint.id}: ${complaint.title}**\n\n` +
      `• Category: ${complaint.category}\n` +
      `• Severity: **${complaint.severity}**\n` +
      `• Status: ${statusLabel(complaint.status)}\n` +
      `• Location: ${complaint.location.address}, ${complaint.location.district}\n` +
      `• Votes/comments: ${complaint.votes} votes, ${complaint.comments} comments\n` +
      `• AI estimate: ${complaint.aiAnalysis ? `${formatMoney(complaint.aiAnalysis.estimatedCost)} with priority ${complaint.aiAnalysis.priority}/100` : 'Not available'}\n` +
      `• Assigned contractor: ${assignedContractor?.company || complaint.assignedTo || 'Not assigned yet'}\n` +
      `• Related project: ${relatedProject ? `${relatedProject.title}, ${projectStatusLine(relatedProject)}` : 'No linked project yet'}\n\n` +
      `Recommended next step: ${complaint.status === 'pending' ? 'government verification and authority routing' : complaint.status === 'verified' ? 'assign a qualified contractor' : complaint.status === 'resolved' ? 'citizen closure feedback' : 'monitor SLA and work evidence'}.`;
  };

  const projectStatusLine = (project: typeof projects[number]) =>
    `${statusLabel(project.status)}, ${project.progress}% complete, ${formatMoney(project.spent)} spent of ${formatMoney(project.budget)}`;

  const routingAnswer = (query: string) => {
    const q = normalize(query);
    if (q.includes('drain') || q.includes('flood') || q.includes('water')) {
      return 'Drainage, flooding and waterlogging complaints should be routed to the Stormwater / Drainage authority first, with Executive Engineer escalation for repeated flooding or public safety risk.';
    }
    if (q.includes('light') || q.includes('lamp') || q.includes('wire')) {
      return 'Streetlight complaints should be routed to the Electrical division. Exposed wiring or dark junctions should be treated as high priority safety issues.';
    }
    if (q.includes('pothole') || q.includes('crack') || q.includes('road')) {
      return 'Potholes, cracks and road-surface failures should be routed to the Road Works Executive Engineer. Critical arterial-road damage should also notify traffic coordination.';
    }
    return 'Routing rule: classify the complaint by issue type, locate the road authority for that ward/district, assign severity from AI analysis, then escalate critical issues to the Executive Engineer and relevant safety department.';
  };

  const getAIResponse = (rawQuery: string): { content: string; actions?: Message['actions'] } => {
    const query = normalize(rawQuery);
    const matchedProject = findProject(rawQuery);
    const matchedComplaint = findComplaint(rawQuery);
    const asksMoney = ['estimate', 'estimated', 'budget', 'cost', 'spent', 'sanction', 'allocation', 'amount'].some((word) => query.includes(word));
    const asksContractor = ['contractor', 'constructor', 'company', 'license', 'who is doing', 'who handles'].some((word) => query.includes(word));
    const asksProgress = ['progress', 'status', 'timeline', 'completion', 'work', 'repair history'].some((word) => query.includes(word));
    const asksAuthority = ['authority', 'route', 'routing', 'engineer', 'department', 'responsible'].some((word) => query.includes(word));

    if (matchedProject && (asksMoney || asksContractor || asksProgress || query.includes('road'))) {
      return {
        content: projectAnswer(matchedProject),
        actions: [
          { label: 'Open Projects', icon: FileText },
          { label: 'View Budget', icon: BarChart3 }
        ]
      };
    }

    if (matchedComplaint && (query.includes('complaint') || query.includes('issue') || query.includes('status') || asksMoney)) {
      return {
        content: complaintAnswer(matchedComplaint),
        actions: [
          { label: 'Open Complaints', icon: AlertCircle },
          { label: 'View Map', icon: MapPin }
        ]
      };
    }

    if (asksAuthority) {
      return {
        content: `${routingAnswer(rawQuery)}\n\nFor accountability, ROAD-WATCH should show the receiving authority, escalation owner, assigned contractor, SLA deadline and final closure proof for each complaint.`,
        actions: [
          { label: 'Open Complaints', icon: AlertCircle },
          { label: 'View Help', icon: HelpCircle }
        ]
      };
    }

    if (asksMoney) {
      const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
      const totalSpent = projects.reduce((sum, project) => sum + project.spent, 0);
      const pending = budgetEntries.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + entry.amount, 0);
      const projectLines = projects.map((project) =>
        `• ${project.title} (${project.roadType}): ${formatMoney(project.budget)} sanctioned from ${project.budgetSource}, ${formatMoney(project.spent)} spent, ${project.progress}% complete`
      ).join('\n');

      return {
        content: `Budget overview from current ROAD-WATCH records:\n\n${projectLines}\n\nTotal sanctioned: **${formatMoney(totalBudget)}**\nTotal spent: **${formatMoney(totalSpent)}**\nPending budget requests: **${formatMoney(pending)}**\n\nAsk for a specific road name, like "estimate for MG Road", and I can break down contractor, spend, complaint links and latest work logs.`,
        actions: [
          { label: 'Open Budget', icon: BarChart3 },
          { label: 'Transparency', icon: FileText }
        ]
      };
    }

    if (asksContractor) {
      const contractorLines = contractors.map((contractor) =>
        `• ${contractor.company}: ${contractor.rating}/5 rating, ${contractor.completedProjects} completed, ${contractor.activeProjects} active, license ${contractor.license}, status ${contractor.status}`
      ).join('\n');

      return {
        content: `Contractor registry:\n\n${contractorLines}\n\nFor a specific road, ask "who is contractor for MG Road" or "contractor for HSR Layout", and I will connect it to the road project and budget record.`,
        actions: [
          { label: 'Open Contractors', icon: Truck },
          { label: 'View Projects', icon: FileText }
        ]
      };
    }

    if (query.includes('critical') || query.includes('urgent')) {
      return {
        content: `Based on current data, there are **${complaints.filter(c => c.severity === 'critical').length} critical issues** in your region:\n\n${complaints.filter(c => c.severity === 'critical').map((complaint) => `• ${complaint.id}: ${complaint.title} at ${complaint.location.address} - ${statusLabel(complaint.status)}, priority ${complaint.aiAnalysis?.priority || 'NA'}/100`).join('\n') || 'No critical complaints are currently open.'}\n\nCritical road-safety issues should be routed to the Executive Engineer and monitored until contractor proof is uploaded.`,
        actions: [
          { label: 'View on Map', icon: MapPin },
          { label: 'Get Details', icon: FileText }
        ]
      };
    }

    if (query.includes('file') || query.includes('report') || query.includes('complaint')) {
      const pending = complaints.filter((complaint) => complaint.status !== 'resolved');
      return {
        content: `Complaint support:\n\nCurrent unresolved complaints: **${pending.length}**\n${pending.slice(0, 5).map((complaint) => `• ${complaint.id}: ${complaint.title} - ${complaint.severity}, ${statusLabel(complaint.status)}, est. ${formatMoney(complaint.aiAnalysis?.estimatedCost || 0)}`).join('\n')}\n\nTo file a new complaint, upload a road photo. The app auto-detects pothole/crack/drainage/flooding/streetlight/debris, suggests severity, estimates cost, and still lets the user manually override the category.`,
        actions: [
          { label: 'Start Filing', icon: AlertCircle },
          { label: 'View Examples', icon: FileText }
        ]
      };
    }

    if (query.includes('status') || query.includes('track')) {
      const activeProjects = projects.filter((project) => project.status !== 'completed');
      return {
        content: `Current active road-work status:\n\n${activeProjects.map((project) => `• ${project.title}: ${projectStatusLine(project)}`).join('\n')}\n\nFor complaint tracking, ask with a complaint ID such as "status of C003" or with a road name like "MG Road progress".`,
        actions: [
          { label: 'Enable Notifications', icon: AlertCircle },
          { label: 'View All', icon: FileText }
        ]
      };
    }

    if (query.includes('analytics') || query.includes('statistics') || query.includes('trending')) {
      const categoryCounts = complaints.reduce<Record<string, number>>((acc, complaint) => {
        acc[complaint.category] = (acc[complaint.category] || 0) + 1;
        return acc;
      }, {});
      const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
      return {
        content: `Analytics summary:\n\n• Total complaints: ${complaints.length}\n• Open complaints: ${complaints.filter((complaint) => complaint.status !== 'resolved').length}\n• Resolved complaints: ${complaints.filter((complaint) => complaint.status === 'resolved').length}\n• Most common category: ${topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'NA'}\n• Total project budget: ${formatMoney(projects.reduce((sum, project) => sum + project.budget, 0))}\n• Total spend recorded: ${formatMoney(projects.reduce((sum, project) => sum + project.spent, 0))}\n\nUseful follow-ups: "which roads are delayed?", "budget spent by road", or "critical drainage complaints".`,
        actions: [
          { label: 'View Charts', icon: BarChart3 },
          { label: 'Export Report', icon: FileText }
        ]
      };
    }

    if (query.includes('how') || query.includes('process') || query.includes('work')) {
      return {
        content: `ROAD-WATCH workflow:\n\n1. Citizen reports issue with photo/location.\n2. AI detects issue type, severity, duplicate risk and estimated cost.\n3. Government verifies and routes to the correct authority.\n4. Contractor is assigned based on region, specialization and performance.\n5. Contractor updates milestones, work logs, materials and photos.\n6. Budget spend, repair history and contractor details become visible in the transparency portal.\n7. Authority verifies completion and citizen closure feedback is captured.\n\nFor specific work, ask "work progress for MG Road" or "repair history for Koramangala".`,
        actions: [
          { label: 'File Complaint', icon: AlertCircle },
          { label: 'View FAQ', icon: HelpCircle }
        ]
      };
    }

    return {
      content: `I can answer road-infrastructure questions using the current prototype data. Try asking in any natural format:\n\n• "What is the estimate for MG Road?"\n• "Who is the contractor for HSR Layout?"\n• "How much money was spent on Koramangala street lights?"\n• "Show pending complaints"\n• "Which authority handles drainage?"\n• "What is the repair status of C001?"\n\nI can cover road type, budget, amount spent, contractor, license, progress, complaint severity, AI cost estimate, authority routing and repair history.`,
      actions: [
        { label: 'Report Issue', icon: AlertCircle },
        { label: 'View Map', icon: MapPin }
      ]
    };
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleAction = (label: string) => {
    const viewByLabel: Record<string, string> = {
      'Report Issue': 'complaints',
      'Track Complaint': 'complaints',
      'View Map': 'map',
      'View on Map': 'map',
      'Get Details': 'complaints',
      'Start Filing': 'complaints',
      'View Examples': 'help',
      'Enable Notifications': 'alerts',
      'View All': 'complaints',
      'View Charts': 'analytics',
      'Export Report': 'reports',
      'File Complaint': 'complaints',
      'View FAQ': 'help',
      'Open Projects': 'projects',
      'View Budget': 'budget',
      'Open Complaints': 'complaints',
      'Open Budget': 'budget',
      'Transparency': 'transparency',
      'Open Contractors': 'contractors',
      'View Projects': 'projects',
      'View Help': 'help'
    };
    const view = viewByLabel[label];
    if (view) setCurrentView(view);
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
                              onClick={() => handleAction(action.label)}
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
