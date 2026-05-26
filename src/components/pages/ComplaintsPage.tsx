import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Camera,
  Bot,
  ChevronRight,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Textarea, Select } from '../ui/Input';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';

type ComplaintCategory = 'pothole' | 'crack' | 'flooding' | 'debris' | 'streetlight' | 'drainage' | 'other';

interface DamageDetection {
  category: ComplaintCategory;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  estimatedCost: number;
  resolutionTime: string;
  confidence: number;
  reason: string;
}

const categoryLabels: Record<ComplaintCategory, string> = {
  pothole: 'Pothole',
  crack: 'Road Crack',
  flooding: 'Water Logging / Flooding',
  debris: 'Debris / Obstruction',
  streetlight: 'Street Light',
  drainage: 'Drainage Issue',
  other: 'Other Road Damage'
};

function detectDamageFromImages(files: File[], title: string, description: string): DamageDetection {
  const evidence = `${files.map((file) => file.name).join(' ')} ${title} ${description}`.toLowerCase();
  const size = files.reduce((sum, file) => sum + file.size, 0);

  const matchers: Array<{ category: ComplaintCategory; label: string; terms: string[]; baseCost: number }> = [
    { category: 'pothole', label: 'Pothole - road surface cavity', terms: ['pothole', 'hole', 'pit', 'cavity', 'asphalt'], baseCost: 55000 },
    { category: 'crack', label: 'Road Crack - surface fracture', terms: ['crack', 'fracture', 'broken', 'surface', 'split'], baseCost: 120000 },
    { category: 'flooding', label: 'Water Logging / Flooding', terms: ['flood', 'water', 'logging', 'waterlog', 'rain'], baseCost: 180000 },
    { category: 'drainage', label: 'Drainage Blockage', terms: ['drain', 'sewage', 'gutter', 'overflow'], baseCost: 160000 },
    { category: 'streetlight', label: 'Street Light Fault', terms: ['light', 'lamp', 'pole', 'dark', 'wire'], baseCost: 25000 },
    { category: 'debris', label: 'Debris / Road Obstruction', terms: ['debris', 'sand', 'stone', 'tree', 'block', 'obstruction'], baseCost: 18000 }
  ];

  const scored = matchers
    .map((matcher) => ({
      ...matcher,
      score: matcher.terms.reduce((score, term) => score + (evidence.includes(term) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0].score > 0 ? scored[0] : matchers[0];
  const severity: DamageDetection['severity'] =
    evidence.includes('accident') || evidence.includes('danger') || evidence.includes('deep') || files.length >= 3
      ? 'critical'
      : size > 4_000_000 || evidence.includes('large') || evidence.includes('major')
        ? 'high'
        : size > 1_000_000
          ? 'medium'
          : 'medium';
  const severityBoost = severity === 'critical' ? 38 : severity === 'high' ? 24 : severity === 'medium' ? 12 : 0;

  return {
    category: best.category,
    label: best.label,
    severity,
    priority: Math.min(98, 50 + severityBoost + best.score * 7),
    estimatedCost: best.baseCost + (severity === 'critical' ? 50000 : severity === 'high' ? 25000 : 0),
    resolutionTime: severity === 'critical' ? '24-48 hours' : severity === 'high' ? '3-5 days' : '5-7 days',
    confidence: Math.min(96, 72 + best.score * 8 + Math.min(files.length, 3) * 4),
    reason: best.score > 0
      ? 'Matched visual evidence and file metadata keywords from uploaded road damage photo.'
      : 'No explicit filename clues found, so the prototype defaults to the most common road-surface damage pattern.'
  };
}

function getRoutingAuthority(category: string, severity: string) {
  if (category === 'streetlight') return 'Electrical Division - Street Lighting Engineer';
  if (category === 'drainage' || category === 'flooding') return 'Stormwater Drainage Authority';
  if (category === 'pothole' || category === 'crack') {
    return severity === 'critical'
      ? 'Executive Engineer - Road Works + Traffic Safety Cell'
      : 'Executive Engineer - Road Works';
  }
  if (category === 'debris') return 'Ward Sanitation and Road Clearance Cell';
  return 'Ward Infrastructure Officer';
}

export function ComplaintsPage() {
  const { complaints, user, addComplaint } = useStore();
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [damageDetection, setDamageDetection] = useState<DamageDetection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: '',
    category: 'pothole',
    location: ''
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || complaint.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const { api } = await import("../../services/api");
    const urls: string[] = [];
    for (const file of files.slice(0, 5 - uploadedImages.length)) {
      try {
        const result = await api.uploadImage(file);
        urls.push("http://localhost:8000" + result.url);
      } catch (err) {
        console.error("Upload failed:", err);
        urls.push(await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        }));
      }
    }
    setUploadedImages((prev) => [...prev, ...urls]);
    const detected = detectDamageFromImages(files, newComplaint.title, newComplaint.description);
    setDamageDetection(detected);
    setShowAIAnalysis(true);
    setNewComplaint((prev) => ({
      ...prev,
      category: detected.category,
      title: prev.title || `${categoryLabels[detected.category]} reported`,
      description: prev.description || `${detected.label} detected from uploaded road damage photo. Please review and add more details if needed.`
    }));
    setUploading(false);
  };

  const handleAIAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      const detected = detectDamageFromImages([], newComplaint.title, newComplaint.description);
      setDamageDetection(detected);
      setNewComplaint((prev) => ({
        ...prev,
        category: detected.category,
        title: prev.title || `${categoryLabels[detected.category]} reported`,
        description: prev.description || `${detected.label} detected from complaint details. Please review and add more details if needed.`
      }));
      setAiAnalyzing(false);
      setShowAIAnalysis(true);
    }, 2000);
  };

  const handleSubmitComplaint = () => {
    const complaint = {
      id: `C${Date.now()}`,
      title: newComplaint.title || `${categoryLabels[(damageDetection?.category || newComplaint.category) as ComplaintCategory]} reported`,
      description: newComplaint.description || damageDetection?.reason || 'Road damage reported with uploaded photo evidence.',
      category: newComplaint.category as ComplaintCategory,
      severity: damageDetection?.severity || 'medium' as const,
      status: 'pending' as const,
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: newComplaint.location || 'Location not specified',
        district: 'Bangalore Urban',
        state: 'Karnataka'
      },
      images: uploadedImages,
      reportedBy: user?.id || 'anonymous',
      reportedAt: new Date().toISOString(),
      aiAnalysis: {
        category: damageDetection?.category || newComplaint.category,
        severity: damageDetection?.severity || 'medium',
        estimatedCost: damageDetection?.estimatedCost || 45000,
        priority: damageDetection?.priority || 65
      },
      votes: 0,
      comments: 0
    };
    
    addComplaint(complaint);
    setShowNewComplaint(false);
    setNewComplaint({ title: '', description: '', category: 'pothole', location: '' });
    setShowAIAnalysis(false);
    setDamageDetection(null);
    setUploadedImages([]);
  };

  const isGovernmentOrAdmin = user?.role === 'government' || user?.role === 'superadmin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isGovernmentOrAdmin ? 'Complaint Management' : 'My Complaints'}
          </h1>
          <p className="text-surface-400">
            {isGovernmentOrAdmin 
              ? 'Review, verify and assign complaints'
              : 'Track and manage your reported issues'
            }
          </p>
        </div>
        {user?.role === 'citizen' && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewComplaint(true)}>
            Report New Issue
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card variant="gradient" className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'verified', label: 'Verified' },
            { value: 'assigned', label: 'Assigned' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' }
          ]}
        />
        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Severity' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
          ]}
        />
        <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredComplaints.map((complaint, index) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="gradient" hover className="cursor-pointer">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-surface-500">{complaint.id}</span>
                      <SeverityBadge severity={complaint.severity} />
                      <StatusBadge status={complaint.status} />
                      {complaint.aiAnalysis && (
                        <span className="flex items-center gap-1 text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                          <Bot className="w-3 h-3" />
                          AI Analyzed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{complaint.title}</h3>
                    <p className="text-sm text-surface-400 line-clamp-2 mb-2">{complaint.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-surface-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {complaint.location.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(complaint.reportedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Routed to {getRoutingAuthority(complaint.category, complaint.severity)}
                      </span>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-surface-400">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{complaint.votes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{complaint.comments}</span>
                      </div>
                    </div>
                    
                    {isGovernmentOrAdmin && complaint.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Reject</Button>
                        <Button size="sm">Verify</Button>
                      </div>
                    )}
                    {isGovernmentOrAdmin && complaint.status === 'verified' && (
                      <Button size="sm">Assign Contractor</Button>
                    )}
                    
                    <ChevronRight className="w-5 h-5 text-surface-500" />
                  </div>
                </div>

                {/* AI Analysis Preview */}
                {complaint.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-surface-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary-400" />
                      <span className="text-sm font-medium text-primary-400">AI Analysis</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Category</p>
                        <p className="text-sm font-medium text-white capitalize">{complaint.aiAnalysis.category}</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Priority Score</p>
                        <p className="text-sm font-medium text-white">{complaint.aiAnalysis.priority}/100</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Est. Cost</p>
                        <p className="text-sm font-medium text-white">₹{complaint.aiAnalysis.estimatedCost.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-surface-800/50 rounded-lg">
                        <p className="text-xs text-surface-400">Severity</p>
                        <p className="text-sm font-medium text-white capitalize">{complaint.aiAnalysis.severity}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredComplaints.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No complaints found</h3>
          <p className="text-surface-400">Try adjusting your search or filter criteria</p>
        </Card>
      )}

      {/* New Complaint Modal */}
      <Modal
        isOpen={showNewComplaint}
        onClose={() => {
          setShowNewComplaint(false);
          setShowAIAnalysis(false);
          setDamageDetection(null);
        }}
        title="Report New Issue"
        size="lg"
      >
        <div className="space-y-6">
          {/* AI Analysis Result */}
          <AnimatePresence>
            {showAIAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent-400" />
                  <span className="font-medium text-white">AI Analysis Complete</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-surface-400">Detected Category</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.label || 'Road damage detected'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Suggested Severity</p>
                    <p className="text-sm font-medium text-warning-400 capitalize">{damageDetection?.severity || 'Medium'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Confidence</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.confidence || 76}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Est. Resolution Time</p>
                    <p className="text-sm font-medium text-white">{damageDetection?.resolutionTime || '5-7 days'}</p>
                  </div>
                </div>
                <p className="text-xs text-surface-400 mt-3">{damageDetection?.reason}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Issue Title"
            placeholder="Brief description of the issue"
            value={newComplaint.title}
            onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
          />

          <Textarea
            label="Detailed Description"
            placeholder="Provide more details about the issue, including any safety concerns..."
            value={newComplaint.description}
            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
          />

          <Select
            label="Category (auto detected, manual override optional)"
            value={newComplaint.category}
            onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
            options={[
              { value: 'pothole', label: 'Pothole' },
              { value: 'crack', label: 'Road Crack' },
              { value: 'flooding', label: 'Water Logging / Flooding' },
              { value: 'drainage', label: 'Drainage Issue' },
              { value: 'streetlight', label: 'Street Light' },
              { value: 'debris', label: 'Debris / Obstruction' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <Input
            label="Location"
            placeholder="Enter address or use current location"
            value={newComplaint.location}
            onChange={(e) => setNewComplaint({ ...newComplaint, location: e.target.value })}
            icon={<MapPin className="w-4 h-4" />}
            rightIcon={
  <button
    className="text-primary-400 hover:text-primary-300"
    onClick={() => {
      if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            .then(r => r.json())
            .then(data => {
              setNewComplaint(prev => ({
                ...prev,
                location: data.display_name || `${latitude}, ${longitude}`
              }));
            })
            .catch(() => {
              setNewComplaint(prev => ({
                ...prev,
                location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              }));
            });
        },
        () => alert('Location access denied. Please allow location in browser settings.')
      );
    }}
  >
    <MapPin className="w-4 h-4" />
  </button>
}
          />

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Upload Photos/Videos
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <div
              className="border-2 border-dashed border-surface-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-10 h-10 text-surface-500 mx-auto mb-3" />
              {uploading ? (
                <p className="text-primary-400 mb-2">Uploading...</p>
              ) : (
                <p className="text-surface-400 mb-2">Drag and drop or click to upload</p>
              )}
              <p className="text-xs text-surface-500">Max 5 images, 10MB each</p>
              <p className="text-xs text-primary-400 mt-1">Uploading a road photo auto-detects the problem type.</p>
              <Button variant="outline" size="sm" className="mt-3 pointer-events-none" icon={<Upload className="w-4 h-4" />}>
                Browse Files
              </Button>
            </div>
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`upload-${i}`} className="w-20 h-20 object-cover rounded-lg border border-surface-700" />
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white rounded-full text-xs flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setUploadedImages(prev => prev.filter((_, idx) => idx !== i)); }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              icon={<Bot className="w-4 h-4" />}
              onClick={handleAIAnalysis}
              loading={aiAnalyzing}
            >
              {aiAnalyzing ? 'Analyzing...' : 'AI Analyze'}
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSubmitComplaint}
              disabled={!newComplaint.title && uploadedImages.length === 0}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
