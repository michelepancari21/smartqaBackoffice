import React, { useState, useEffect, useRef } from 'react';
import { SquarePen, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTestCasesClick: (e: React.MouseEvent) => void;
  onTestRunsClick: (e: React.MouseEvent) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  disabled: boolean;
}

function getCategoryFromName(name: string): { label: string; color: string } | null {
  const lower = name.toLowerCase();
  if (lower.includes('vod') || lower.includes('playvod') || lower.includes('playcin'))
    return { label: 'VOD', color: 'bg-orange-500' };
  if (lower.includes('music') || lower.includes('playup'))
    return { label: 'Music', color: 'bg-cyan-500' };
  if (lower.includes('product') || lower.includes('masterch'))
    return { label: 'WL Product', color: 'bg-green-500' };
  if (lower.includes('sport'))
    return { label: 'Sport', color: 'bg-red-500' };
  if (lower.includes('news'))
    return { label: 'News', color: 'bg-blue-500' };
  return null;
}

const CardActionMenu: React.FC<{
  onDuplicate: () => void;
  onDelete: () => void;
  canCreate: boolean;
  canDelete: boolean;
  disabled: boolean;
}> = ({ onDuplicate, onDelete, canCreate, canDelete, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!canCreate && !canDelete) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={disabled}
        className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-200 dark:hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
          {canCreate && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDuplicate(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-400 dark:text-gray-400" />
              Duplicate Project
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  onTestCasesClick,
  onTestRunsClick,
  canEdit,
  canCreate,
  canDelete,
  disabled
}) => {
  const category = getCategoryFromName(project.name);

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-500/40 dark:hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-200"
    >
      {/* Top section: badge + actions */}
      <div className="flex items-start justify-between px-5 pt-5 pb-0">
        {category ? (
          <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-md ${category.color}`}>
            {category.label}
          </span>
        ) : (
          <span className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-md bg-slate-500">
            Project
          </span>
        )}

        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              disabled={disabled}
              className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Edit"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          )}
          <CardActionMenu
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            canCreate={canCreate}
            canDelete={canDelete}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-4 pb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-tight">
          {project.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Footer: test cases + test runs */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/60 dark:border-slate-700/40">
        <button
          onClick={onTestCasesClick}
          className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
        >
          {project.testCasesCount} Test cases
        </button>
        <button
          onClick={onTestRunsClick}
          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
        >
          {project.testRunsCount > 0
            ? `${project.testRunsCount} test${project.testRunsCount !== 1 ? 's' : ''} run`
            : 'No test run'}
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
