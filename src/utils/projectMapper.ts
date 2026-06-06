import { Project } from '../store/useStore';

export function mapApiProject(project: any, contractorName?: string): Project {
  return {
    id: project._id || project.id,
    title: project.title,
    description: project.description,
    roadType: 'Ward Road',
    lastRelayingDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    responsibleAuthority: 'BBMP Road Infrastructure Division',
    executiveEngineer: 'Executive Engineer - Road Works',
    budgetSource: 'Emergency Road Maintenance Contingency Fund',
    qualityScore: 65,
    contractor: project.contractor_id,
    contractorName,
    budget: project.budget || 0,
    spent: project.spent || 0,
    startDate: project.start_date || new Date().toISOString(),
    endDate: project.end_date || new Date().toISOString(),
    status: project.status,
    progress: project.progress || 0,
    location: {
      lat: project.location?.coordinates?.[1] || 0,
      lng: project.location?.coordinates?.[0] || 0,
      address: project.location?.address || 'Assigned work location',
      district: project.location?.district || 'Bangalore Urban'
    },
    complaints: project.complaint_ids || [],
    milestones: (project.milestones || []).map((milestone: any) => ({
      title: milestone.title,
      completed: milestone.completed,
      date: milestone.date
    })),
    workLogs: (project.work_logs || []).map((log: any) => ({
      id: log.id,
      date: log.date,
      description: log.description,
      workersCount: log.workers_count || log.workersCount || 0,
      materialsUsed: log.materials_used || log.materialsUsed || [],
      photos: [
        ...(log.images || []),
        ...(log.before_work_photos || []),
        ...(log.progress_photos || []),
        ...(log.completion_photos || [])
      ],
      addedBy: log.created_by || log.addedBy || contractorName || 'Contractor'
    })),
    approvedBy: 'Government Admin'
  };
}
