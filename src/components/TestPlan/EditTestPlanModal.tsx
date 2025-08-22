import React, { useState, useEffect } from 'react';
import { Loader, Save } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { TestPlan } from '../../services/testPlansApi';

interface EditTestPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
  }) => Promise<void>;
  testPlan: TestPlan | null;
  isSubmitting: boolean;
}

const EditTestPlanModal: React.FC<EditTestPlanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  testPlan,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    title: ''
  });

  // Populate form when testPlan changes
  useEffect(() => {
    if (isOpen && testPlan) {
      setFormData({
        title: testPlan.title
      });
    } else if (isOpen && !testPlan) {
      setFormData({
        title: ''
      });
    }
  }, [isOpen, testPlan]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Test Plan"
      size="small"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Test Plan Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder="Enter test plan title"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} icon={Save}>
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTestPlanModal;