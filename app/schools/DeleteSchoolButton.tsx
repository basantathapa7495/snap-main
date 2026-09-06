'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type DeleteSchoolButtonProps = {
  id: string;
};

export default function DeleteSchoolButton({
  id,
}: DeleteSchoolButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this school?'
    );

    if (!confirmed) return;

    setDeleting(true);

    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`❌ Failed to delete school: ${error.message}`);
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}