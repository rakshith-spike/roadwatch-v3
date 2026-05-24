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
      }
    }
    setUploadedImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const handleAIAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalyzing(false);
      setShowAIAnalysis(true);
    }, 2000);
  };

  const handleSubmitComplaint = () => {
    const complaint = {
      id: `C${Date.now()}`,
      title: newComplaint.title,
      description: newComplaint.description,
      category: newComplaint.category as 'pothole' | 'crack' | 'flooding' | 'debris' | 'streetlight' | 'drainage' | 'other',
      severity: 'medium' as const,
      status: 'pending' as const,
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: newComplaint.location || 'Location not specified',
        district: 'Bangalore Urban',
        state: 'Karnataka'
      },
      images: [],
      reportedBy: user?.id || 'anonymous',
      reportedAt: new Date().toISOString(),
      aiAnalysis: {
        category: newComplaint.category,
        severity: 'medium',
        estimatedCost: 45000,
        priority: 65
      },
      votes: 0,
      comments: 0
    };
    
    addComplaint(complaint);
    setShowNewComplaint(false);
    setNewComplaint({ title: '', description: '', category: 'pothole', location: '' });
    setShowAIAnalysis(false);
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
                    <p className="text-sm font-medium text-white">Pothole - Deep cavity</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Suggested Severity</p>
                    <p className="text-sm font-medium text-warning-400">High</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Similar Complaints</p>
                    <p className="text-sm font-medium text-white">2 nearby (not duplicate)</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Est. Resolution Time</p>
                    <p className="text-sm font-medium text-white">5-7 days</p>
                  </div>
                </div>
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
            label="Category"
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
              disabled={!newComplaint.title || !newComplaint.description}
            >
              Submit Complaint
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
