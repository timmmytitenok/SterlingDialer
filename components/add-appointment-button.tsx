'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddAppointmentModal } from './add-appointment-modal';

interface AddAppointmentButtonProps {
  userId: string;
}

export function AddAppointmentButton({ userId }: AddAppointmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500/30 text-blue-400 transition-all duration-200 hover:scale-110 hover:bg-blue-600/30 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/40 hover:text-blue-300"
        title="Add New Appointment"
      >
        <Plus className="w-6 h-6" />
      </button>

      {isModalOpen && (
        <AddAppointmentModal
          onClose={() => setIsModalOpen(false)}
          userId={userId}
        />
      )}
    </>
  );
}

