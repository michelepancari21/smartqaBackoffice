import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { TestRun } from '../../services/testRunsApi';

interface CloseTestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  testRun: TestRun | null;
  isSubmitting: boolean;
}

const CloseTestRunModal: React.FC<CloseTestRunModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  testRun,
  isSubmitting
}) => {
  if (!testRun) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Close Test Run"
      size="md"
    >
      <div className="space-y-6">
        {/* Warning Icon and Message */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Close Test Run: "{testRun.name}"
            </h3>
            <p className="text-gray-300 mb-4">
              You are about to close this test run. Once closed, you will have a grace period of 
              <strong className="text-orange-400"> 2 hours</strong> to reopen it if needed.
            </p>
          </div>
        </div>

        {/* Important Notice - Same width as Test Run Summary */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-orange-400">Important Notice</span>
          </div>
          <p className="text-sm text-orange-300">
            After the 2-hour grace period expires, you will not be able to reopen this test run. 
            Make sure all test executions are complete before proceeding.
          </p>
        </div>

        {/* Confirmation Question */}
        <div className="text-center">
          <p className="text-white font-medium">
            Are you sure you want to close this test run?
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            variant="warning"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Closing...' : 'Close Test Run'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CloseTestRunModal;